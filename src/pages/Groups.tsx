import { useState, useEffect } from 'react';
import { Users, Plus, Copy, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ContextualTip } from '@/components/Onboarding/ContextualTip';

interface Group {
  id: string;
  code: string;
  name: string;
  created_by: string;
  created_at: string;
  target_regions?: Array<{city: string; district: string}> | null;
  current_region?: {city: string; district: string} | null;
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
  const navigate = useNavigate();
  const { showGroupTip, markGroupTipSeen } = useOnboarding();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<Array<{city: string, district: string}>>([]);
  
  // ✅ 教學訊息控制
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  // ✅ 首次訪問時顯示教學訊息（不限制是否有群組）
  useEffect(() => {
    if (!loading && showGroupTip) {
      const timer = setTimeout(() => {
        setShowTip(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, showGroupTip]);

  const fetchGroups = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Optimized query: Get groups with members and profiles in one go
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberData.map(m => m.group_id);

      // Get groups with their details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, code, name, created_by, created_at, target_regions, current_region')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Batch fetch all members and profiles
      const { data: allMembersData } = await supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', groupIds);

      const allUserIds = [...new Set(allMembersData?.map(m => m.user_id) || [])];
      const { data: allProfilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', allUserIds);

      // Build groups with members efficiently
      const groupsWithMembers = (groupsData || []).map(group => {
        const groupMembers = (allMembersData || [])
          .filter(m => m.group_id === group.id)
          .map(member => {
            const profile = allProfilesData?.find(p => p.user_id === member.user_id);
            return {
              user_id: member.user_id,
              profiles: profile ? { display_name: profile.display_name || '未知用戶' } : null
            };
          });

        return {
          ...group,
          target_regions: group.target_regions ? (group.target_regions as any) : null,
          current_region: group.current_region ? (group.current_region as any) : null,
          group_members: groupMembers
        };
      });

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "載入失敗",
        description: "無法載入群組清單，請重試",
        variant: "destructive",
      });
      setGroups([]);
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

    if (selectedRegions.length === 0) {
      toast({
        title: "請至少選擇一個目標區域",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique 6-digit code
      const { data: codeData } = await supabase
        .rpc('generate_group_code');
      
      const code = codeData as string;

      // Create the group with target regions
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          code: code,
          created_by: user?.id,
          target_regions: selectedRegions as any,
          current_region: selectedRegions.length > 0 ? (selectedRegions[0] as any) : null
        } as any)
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
      setSelectedRegions([]);
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
        .maybeSingle();

      if (groupError) {
        console.error('Error finding group:', groupError);
        toast({
          title: "查詢失敗",
          description: "無法查詢群組，請重試",
          variant: "destructive",
        });
        return;
      }

      if (!groupData) {
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
      {/* ✅ 教學訊息 */}
      {showTip && (
        <ContextualTip
          message="建立群組和朋友一起滑卡，系統會自動找出大家都喜歡的餐廳 🎉"
          direction="down"
          onClose={() => {
            markGroupTipSeen();
            setShowTip(false);
          }}
        />
      )}
      
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
              <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                  
                  <div>
                    <Label>目標區域 (可多選)</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {['台北市', '新北市', '基隆市', '桃園市', '新竹市', '台中市', '台南市', '高雄市'].map((city) => (
                          <div key={city} className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{city}</p>
                            <div className="flex flex-wrap gap-1">
                              {city === '台北市' && ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'].map((district) => {
                                const isSelected = selectedRegions.some(r => r.city === city && r.district === district);
                                return (
                                  <Button
                                    key={`${city}-${district}`}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedRegions(prev => prev.filter(r => !(r.city === city && r.district === district)));
                                      } else {
                                        setSelectedRegions(prev => [...prev, { city, district }]);
                                      }
                                    }}
                                  >
                                    {district}
                                  </Button>
                                );
                              })}
                              {city !== '台北市' && (
                                <Button
                                  variant={selectedRegions.some(r => r.city === city) ? "default" : "outline"}
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    if (selectedRegions.some(r => r.city === city)) {
                                      setSelectedRegions(prev => prev.filter(r => r.city !== city));
                                    } else {
                                      setSelectedRegions(prev => [...prev, { city, district: '全區' }]);
                                    }
                                  }}
                                >
                                  全區
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedRegions.length > 0 && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-2">已選擇 {selectedRegions.length} 個區域：</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedRegions.map((region, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {region.city} {region.district}
                                <X 
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setSelectedRegions(prev => prev.filter((_, i) => i !== idx))}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="還沒有加入任何群組"
            description="建立或加入群組來與朋友一起選擇餐廳"
          />
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
                    {group.target_regions && group.target_regions.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">目標區域</p>
                        <div className="flex flex-wrap gap-1">
                          {group.target_regions.map((region, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {region.city} {region.district}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/app/groups/${group.id}/swipe`)}
                      >
                        開始滑卡
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/app/groups/${group.id}/consensus`)}
                      >
                        查看共識
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;