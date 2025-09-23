import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  google_rating: number;
  michelin_stars: number;
  has_500_dishes: boolean;
  bib_gourmand: boolean;
  cuisine_type: string;
  price_range: number;
  photos: string[];
}

interface ConsensusResult {
  restaurant: Restaurant;
  totalVotes: number;
  likes: number;
  dislikes: number;
  likePercentage: number;
  hasConsensus: boolean;
}

interface GroupInfo {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const GroupConsensusSummary = React.memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [consensusResults, setConsensusResults] = useState<ConsensusResult[]>([]);

  const fetchGroupInfo = async () => {
    if (!groupId || !user?.id) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, code')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Check membership
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        toast({
          title: "無法存取群組",
          description: "您不是此群組的成員",
          variant: "destructive",
        });
        navigate('/app/groups');
        return;
      }

      // Get member count
      const { data: allMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      setGroupInfo({
        ...groupData,
        memberCount: allMembers?.length || 0
      });
    } catch (error) {
      console.error('Error fetching group info:', error);
      navigate('/app/groups');
    }
  };

  const fetchConsensusResults = async () => {
    if (!groupId || !groupInfo) return;

    try {
      console.log('[GroupConsensusSummary] Fetching consensus for group:', groupId);
      
      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        console.log('[GroupConsensusSummary] No members found for group');
        setConsensusResults([]);
        return;
      }

      const memberIds = members.map(m => m.user_id);
      console.log('[GroupConsensusSummary] Group members:', memberIds);

      // Get all group swipes from group members
      const { data: swipes, error: swipesError } = await supabase
        .from('user_swipes')
        .select('user_id, restaurant_id, liked, created_at')
        .eq('group_id', groupId)
        .in('user_id', memberIds);

      if (swipesError) throw swipesError;
      
      console.log('[GroupConsensusSummary] Found swipes:', swipes?.length || 0);
      
      if (!swipes || swipes.length === 0) {
        console.log('[GroupConsensusSummary] No swipes found for group');
        setConsensusResults([]);
        return;
      }

      // Group swipes by restaurant
      const restaurantSwipes: { [key: string]: { likes: number; dislikes: number; total: number } } = {};
      
      swipes.forEach(swipe => {
        if (!restaurantSwipes[swipe.restaurant_id]) {
          restaurantSwipes[swipe.restaurant_id] = { likes: 0, dislikes: 0, total: 0 };
        }
        restaurantSwipes[swipe.restaurant_id].total++;
        if (swipe.liked) {
          restaurantSwipes[swipe.restaurant_id].likes++;
        } else {
          restaurantSwipes[swipe.restaurant_id].dislikes++;
        }
      });

      // Get restaurant details
      const restaurantIds = Object.keys(restaurantSwipes);
      if (restaurantIds.length === 0) return;

      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', restaurantIds);

      if (restaurantsError) throw restaurantsError;

      // Build consensus results
      const results: ConsensusResult[] = [];
      
      restaurants?.forEach(restaurant => {
        const swipeData = restaurantSwipes[restaurant.id];
        const likePercentage = (swipeData.likes / swipeData.total) * 100;
        const hasConsensus = likePercentage >= 50;

        results.push({
          restaurant,
          totalVotes: swipeData.total,
          likes: swipeData.likes,
          dislikes: swipeData.dislikes,
          likePercentage,
          hasConsensus
        });
      });

      // Sort by like percentage
      results.sort((a, b) => b.likePercentage - a.likePercentage);

      setConsensusResults(results);
    } catch (error) {
      console.error('Error fetching consensus results:', error);
      toast({
        title: "載入失敗",
        description: "無法載入共識結果",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupInfo();
  }, [groupId, user?.id]);

  useEffect(() => {
    if (groupInfo) {
      fetchConsensusResults();
    }
  }, [groupInfo]);

  if (loading || !groupInfo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalVotedRestaurants = consensusResults.length;
  const consensusRestaurants = consensusResults.filter(r => r.hasConsensus);
  const totalVotes = consensusResults.reduce((sum, r) => sum + r.totalVotes, 0);

  // Data for pie chart
  const pieData = [
    { name: '達成共識', value: consensusRestaurants.length, color: '#10b981' },
    { name: '未達共識', value: totalVotedRestaurants - consensusRestaurants.length, color: '#f59e0b' }
  ];

  // Data for bar chart - top 5 restaurants
  const barData = consensusResults.slice(0, 5).map(r => ({
    name: r.restaurant.name.length > 10 ? r.restaurant.name.substring(0, 10) + '...' : r.restaurant.name,
    likes: r.likes,
    dislikes: r.dislikes,
    percentage: r.likePercentage
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/app/groups/${groupId}/consensus`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{groupInfo.name || `群組 ${groupInfo.code}`}</h1>
            <p className="text-sm text-muted-foreground">共識總結報告</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{groupInfo.memberCount}</div>
              <div className="text-sm text-muted-foreground">群組成員</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{totalVotes}</div>
              <div className="text-sm text-muted-foreground">總投票數</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{consensusRestaurants.length}</div>
              <div className="text-sm text-muted-foreground">達成共識</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{totalVotedRestaurants}</div>
              <div className="text-sm text-muted-foreground">已投票餐廳</div>
            </CardContent>
          </Card>
        </div>

        {consensusResults.length > 0 ? (
          <>
            {/* Top Consensus Results - Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>排行榜</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consensusResults.slice(0, 3).map((result, index) => (
                    <div key={result.restaurant.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 'bg-yellow-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      {result.restaurant.photos && result.restaurant.photos.length > 0 && (
                        <img
                          src={result.restaurant.photos[0]}
                          alt={result.restaurant.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{result.restaurant.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={result.hasConsensus ? "default" : "secondary"}>
                            {result.likePercentage.toFixed(0)}% 喜歡
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.likes}/{result.totalVotes} 票
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>共識達成比例</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>熱門餐廳投票分佈</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          value, 
                          name === 'likes' ? '喜歡' : '不喜歡'
                        ]}
                      />
                      <Bar dataKey="likes" fill="#10b981" name="likes" />
                      <Bar dataKey="dislikes" fill="#ef4444" name="dislikes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">還沒有投票數據</h2>
            <p className="text-muted-foreground">群組成員還沒有開始投票</p>
            <Button 
              onClick={() => navigate(`/app/groups/${groupId}/swipe`)}
              className="mt-4"
            >
              開始滑卡投票
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

GroupConsensusSummary.displayName = 'GroupConsensusSummary';