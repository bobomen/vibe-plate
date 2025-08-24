import { useState, useEffect } from 'react';
import { Users, Plus, Copy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';

interface Group {
  id: string;
  code: string;
  name: string;
  created_by: string;
  created_at: string;
  group_members: {
    user_id: string;
    profiles: {
      display_name: string;
    } | null;
  }[];
}

const Groups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      // First get groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      const groupIds = memberGroups?.map(m => m.group_id) || [];

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      // Then get the groups
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          code,
          name,
          created_by,
          created_at
        `)
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member details separately
      const groupsWithMembers = await Promise.all(
        (data || []).map(async (group) => {
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id);

          return {
            ...group,
            group_members: (members || []).map(member => ({
              user_id: member.user_id,
              profiles: null
            }))
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "載入失敗",
        description: "無法載入群組清單，請重試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "請輸入群組名稱",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique 6-digit code
      const { data: codeData } = await supabase
        .rpc('generate_group_code');
      
      const code = codeData as string;

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          code: code,
          created_by: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user?.id
        });

      if (memberError) throw memberError;

      toast({
        title: "群組建立成功！",
        description: `群組代碼：${code}`,
      });

      setGroupName('');
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "建立失敗",
        description: "無法建立群組，請重試",
        variant: "destructive",
      });
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "請輸入群組代碼",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the group by code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('code', joinCode.trim())
        .single();

      if (groupError || !groupData) {
        toast({
          title: "無效的群組代碼",
          description: "請檢查代碼是否正確",
          variant: "destructive",
        });
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user?.id
        });

      if (joinError) {
        if (joinError.code === '23505') {
          toast({
            title: "您已經是該群組成員",
            variant: "destructive",
          });
        } else {
          throw joinError;
        }
        return;
      }

      toast({
        title: "加入群組成功！",
      });

      setJoinCode('');
      setJoinDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "加入失敗",
        description: "無法加入群組，請重試",
        variant: "destructive",
      });
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "代碼已複製",
      description: "可以分享給朋友加入群組",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">群組</h1>
            <p className="text-sm text-muted-foreground">與朋友一起選擇餐廳</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-1" />
                  加入
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>加入群組</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="joinCode">群組代碼</Label>
                    <Input
                      id="joinCode"
                      placeholder="輸入6位數字代碼"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={joinGroup} className="w-full">
                    加入群組
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  建立
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>建立群組</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">群組名稱</Label>
                    <Input
                      id="groupName"
                      placeholder="輸入群組名稱"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <Button onClick={createGroup} className="w-full">
                    建立群組
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">還沒有加入任何群組</h2>
            <p className="text-muted-foreground">建立或加入群組來與朋友一起選擇餐廳</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {group.name || `群組 ${group.code}`}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyGroupCode(group.code)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {group.code}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        成員 ({group.group_members.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.group_members.map((member, index) => (
                          <div
                            key={`${group.id}-${member.user_id}`}
                            className="px-2 py-1 bg-secondary rounded-md text-sm"
                          >
                            {member.profiles?.display_name || `用戶 ${index + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      查看共識結果
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Groups;