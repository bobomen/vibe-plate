import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export const GroupConsensus = React.memo(() => {
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
      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return;

      const memberIds = members.map(m => m.user_id);

      // Get all group swipes from group members
      const { data: swipes, error: swipesError } = await supabase
        .from('user_swipes')
        .select('user_id, restaurant_id, liked')
        .eq('group_id', groupId)
        .in('user_id', memberIds);

      if (swipesError) throw swipesError;
      if (!swipes || swipes.length === 0) {
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

      // Sort by consensus first, then by like percentage
      results.sort((a, b) => {
        if (a.hasConsensus && !b.hasConsensus) return -1;
        if (!a.hasConsensus && b.hasConsensus) return 1;
        return b.likePercentage - a.likePercentage;
      });

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

  const consensusRestaurants = consensusResults.filter(r => r.hasConsensus);
  const noConsensusRestaurants = consensusResults.filter(r => !r.hasConsensus);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/app/groups/${groupId}/swipe`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{groupInfo.name || `群組 ${groupInfo.code}`}</h1>
            <p className="text-sm text-muted-foreground">共識結果 · {groupInfo.memberCount} 位成員</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Consensus Results */}
        {consensusRestaurants.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-600" />
              達成共識的餐廳 ({consensusRestaurants.length})
            </h2>
            <div className="space-y-3">
              {consensusRestaurants.map((result) => (
                <Card key={result.restaurant.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {result.restaurant.photos && result.restaurant.photos.length > 0 && (
                        <img
                          src={result.restaurant.photos[0]}
                          alt={result.restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{result.restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{result.restaurant.address}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {result.likePercentage.toFixed(0)}% 喜歡
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.likes}/{result.totalVotes} 票
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {result.restaurant.michelin_stars > 0 && (
                            <Badge variant="outline">⭐ {result.restaurant.michelin_stars}星</Badge>
                          )}
                          {result.restaurant.bib_gourmand && (
                            <Badge variant="outline">🏅 必比登</Badge>
                          )}
                          {result.restaurant.has_500_dishes && (
                            <Badge variant="outline">🍽️ 500盤</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Consensus Results */}
        {noConsensusRestaurants.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <X className="h-5 w-5 text-orange-600" />
              未達成共識的餐廳 ({noConsensusRestaurants.length})
            </h2>
            <div className="space-y-3">
              {noConsensusRestaurants.map((result) => (
                <Card key={result.restaurant.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {result.restaurant.photos && result.restaurant.photos.length > 0 && (
                        <img
                          src={result.restaurant.photos[0]}
                          alt={result.restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{result.restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{result.restaurant.address}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {result.likePercentage.toFixed(0)}% 喜歡
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.likes}/{result.totalVotes} 票
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {result.restaurant.michelin_stars > 0 && (
                            <Badge variant="outline">⭐ {result.restaurant.michelin_stars}星</Badge>
                          )}
                          {result.restaurant.bib_gourmand && (
                            <Badge variant="outline">🏅 必比登</Badge>
                          )}
                          {result.restaurant.has_500_dishes && (
                            <Badge variant="outline">🍽️ 500盤</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {consensusResults.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🗳️</div>
            <h2 className="text-xl font-semibold mb-2">還沒有投票結果</h2>
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

GroupConsensus.displayName = 'GroupConsensus';