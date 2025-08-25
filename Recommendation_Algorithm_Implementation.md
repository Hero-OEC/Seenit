# Seenit Hybrid Recommendation Algorithm

## Overview

This document outlines the complete implementation strategy for a hybrid recommendation algorithm that combines content-based filtering and collaborative filtering to provide personalized content recommendations for Seenit users.

## Algorithm Architecture

### Hybrid Approach Components

#### 1. Content-Based Filtering (CBF)
- Analyzes content attributes (genres, cast, directors, themes, ratings)
- Creates user preference profiles based on their interaction history
- Recommends content similar to what users have previously enjoyed
- **Weight in hybrid system**: 40%

#### 2. Collaborative Filtering (CF)
- User-based CF: Find users with similar preferences
- Item-based CF: Find content similar to what user liked
- Matrix factorization for handling sparse data
- **Weight in hybrid system**: 35%

#### 3. Popularity & Trending (PT)
- Global popularity metrics
- Time-sensitive trending detection
- Regional/demographic popularity adjustments
- **Weight in hybrid system**: 15%

#### 4. Context-Aware Factors (CAF)
- Time of day/week viewing patterns
- Platform availability for user
- Seasonal content preferences
- User's current mood indicators
- **Weight in hybrid system**: 10%

### Algorithm Flow

```
User Request → User Profile Analysis → Parallel Processing:
                                    ├── Content-Based Scoring
                                    ├── Collaborative Filtering
                                    ├── Popularity Analysis
                                    └── Context Evaluation
                                              ↓
                                    Weighted Score Combination
                                              ↓
                                    Diversity & Quality Filtering
                                              ↓
                                    Final Recommendation List
```

## Database Schema for Recommendations

### User Preference Tables

#### User Profiles
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Explicit Preferences
  favorite_genres JSONB, -- {genre_id: preference_score}
  preferred_platforms JSONB, -- {platform: usage_frequency}
  content_length_preference VARCHAR(20), -- 'short', 'medium', 'long', 'mixed'
  quality_threshold DECIMAL(2,1), -- Minimum rating they'll watch
  
  -- Behavioral Patterns
  viewing_time_patterns JSONB, -- {hour: activity_level}
  binge_watching_tendency DECIMAL(3,2), -- 0.0-1.0 score
  genre_exploration_willingness DECIMAL(3,2), -- 0.0-1.0 score
  discovery_vs_familiarity_ratio DECIMAL(3,2), -- 0.0-1.0 score
  
  -- Computed Preferences
  content_preference_vector VECTOR(100), -- ML-generated preference embedding
  similar_users JSONB, -- [user_ids] with similarity scores
  taste_diversity_score DECIMAL(3,2),
  preference_stability_score DECIMAL(3,2)
);
```

#### User Interactions
```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  interaction_type VARCHAR(50), -- 'view', 'rate', 'add_to_list', 'remove', 'search', 'click'
  interaction_value DECIMAL(3,2), -- Rating for 'rate', duration for 'view', etc.
  context_data JSONB, -- {platform, time_of_day, device, session_id}
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Computed fields
  interaction_weight DECIMAL(3,2), -- Calculated importance of this interaction
  decay_adjusted_weight DECIMAL(3,2) -- Weight adjusted for time decay
);

CREATE INDEX idx_user_interactions_user_content ON user_interactions(user_id, content_id);
CREATE INDEX idx_user_interactions_type_date ON user_interactions(interaction_type, created_at);
```

#### Content Features
```sql
CREATE TABLE content_features (
  content_id UUID PRIMARY KEY REFERENCES content(id),
  
  -- Basic Attributes
  genres JSONB, -- [genre_ids]
  cast_members JSONB, -- [person_ids] with roles
  directors JSONB, -- [person_ids]
  writers JSONB, -- [person_ids]
  keywords JSONB, -- [keyword_ids] for themes/topics
  
  -- Computed Features
  content_vector VECTOR(100), -- ML-generated content embedding
  genre_distribution JSONB, -- {genre_id: weight} normalized
  popularity_score DECIMAL(3,2),
  quality_score DECIMAL(3,2), -- Aggregated rating from multiple sources
  complexity_score DECIMAL(3,2), -- Content complexity/accessibility
  emotional_tone JSONB, -- {emotion: intensity} e.g., {humor: 0.8, drama: 0.6}
  
  -- Temporal Features
  release_recency_score DECIMAL(3,2),
  trending_momentum DECIMAL(3,2),
  seasonal_relevance JSONB, -- {season: relevance_score}
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Recommendation Tables

#### Generated Recommendations
```sql
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  
  -- Scoring Breakdown
  total_score DECIMAL(5,3),
  content_based_score DECIMAL(5,3),
  collaborative_score DECIMAL(5,3),
  popularity_score DECIMAL(5,3),
  context_score DECIMAL(5,3),
  
  -- Recommendation Context
  recommendation_type VARCHAR(50), -- 'homepage', 'similar', 'trending', 'discovery'
  explanation TEXT, -- Human-readable reason for recommendation
  confidence_level DECIMAL(3,2), -- Algorithm confidence 0.0-1.0
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When this recommendation becomes stale
  position_in_list INTEGER, -- Original ranking position
  
  -- Interaction Tracking
  viewed BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  feedback_score INTEGER -- User feedback: -1, 0, 1
);

CREATE INDEX idx_user_recommendations_user_active ON user_recommendations(user_id, expires_at) 
  WHERE expires_at > NOW();
CREATE INDEX idx_user_recommendations_score ON user_recommendations(user_id, total_score DESC);
```

#### Similarity Matrices
```sql
CREATE TABLE content_similarity (
  content_a_id UUID REFERENCES content(id),
  content_b_id UUID REFERENCES content(id),
  similarity_score DECIMAL(4,3),
  similarity_type VARCHAR(20), -- 'content_based', 'user_based', 'hybrid'
  computed_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (content_a_id, content_b_id),
  CHECK (content_a_id < content_b_id) -- Avoid duplicate pairs
);

CREATE TABLE user_similarity (
  user_a_id UUID REFERENCES users(id),
  user_b_id UUID REFERENCES users(id),
  similarity_score DECIMAL(4,3),
  common_interactions_count INTEGER,
  computed_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);
```

## Implementation Architecture

### Backend Service Structure

#### Recommendation Engine Service
```javascript
// server/services/RecommendationEngine.js
class RecommendationEngine {
  constructor() {
    this.contentBasedFilter = new ContentBasedFilter();
    this.collaborativeFilter = new CollaborativeFilter();
    this.popularityAnalyzer = new PopularityAnalyzer();
    this.contextAnalyzer = new ContextAnalyzer();
    this.hybridCombiner = new HybridCombiner();
  }

  async generateRecommendations(userId, options = {}) {
    const {
      count = 20,
      type = 'homepage',
      excludeWatched = true,
      diversityFactor = 0.3
    } = options;

    // 1. Get user profile and recent interactions
    const userProfile = await this.getUserProfile(userId);
    const recentInteractions = await this.getRecentInteractions(userId, 30); // 30 days

    // 2. Parallel score generation
    const [
      contentBasedScores,
      collaborativeScores,
      popularityScores,
      contextScores
    ] = await Promise.all([
      this.contentBasedFilter.generateScores(userProfile, recentInteractions),
      this.collaborativeFilter.generateScores(userId, userProfile),
      this.popularityAnalyzer.generateScores(userProfile.demographics),
      this.contextAnalyzer.generateScores(userId, this.getCurrentContext())
    ]);

    // 3. Combine scores using hybrid approach
    const combinedScores = this.hybridCombiner.combineScores({
      contentBased: contentBasedScores,
      collaborative: collaborativeScores,
      popularity: popularityScores,
      context: contextScores
    }, userProfile);

    // 4. Apply filters and diversity
    const filteredScores = await this.applyFilters(combinedScores, {
      excludeWatched,
      userProfile,
      diversityFactor
    });

    // 5. Generate final recommendations
    const recommendations = await this.finalizeRecommendations(
      filteredScores.slice(0, count),
      userId,
      type
    );

    // 6. Store recommendations for tracking
    await this.storeRecommendations(recommendations, userId, type);

    return recommendations;
  }

  async getUserProfile(userId) {
    // Fetch and compute user profile if not cached
    const cached = await this.cache.get(`user_profile_${userId}`);
    if (cached && cached.age < 24 * 60 * 60 * 1000) return cached.data;

    const profile = await this.computeUserProfile(userId);
    await this.cache.set(`user_profile_${userId}`, profile, { ttl: 86400 });
    return profile;
  }

  async computeUserProfile(userId) {
    const interactions = await db.select()
      .from(user_interactions)
      .where(eq(user_interactions.user_id, userId))
      .orderBy(desc(user_interactions.created_at))
      .limit(1000);

    const profile = {
      genrePreferences: this.computeGenrePreferences(interactions),
      qualityThreshold: this.computeQualityThreshold(interactions),
      viewingPatterns: this.computeViewingPatterns(interactions),
      diversityPreference: this.computeDiversityPreference(interactions),
      recencyBias: this.computeRecencyBias(interactions),
      platformUsage: this.computePlatformUsage(interactions)
    };

    return profile;
  }
}
```

#### Content-Based Filter Implementation
```javascript
// server/services/ContentBasedFilter.js
class ContentBasedFilter {
  async generateScores(userProfile, recentInteractions) {
    // 1. Build user preference vector
    const userVector = this.buildUserPreferenceVector(userProfile, recentInteractions);
    
    // 2. Get candidate content (not already watched)
    const candidates = await this.getCandidateContent(userProfile.userId);
    
    // 3. Calculate similarity scores
    const scores = new Map();
    
    for (const content of candidates) {
      const contentVector = await this.getContentVector(content.id);
      const similarity = this.calculateCosineSimilarity(userVector, contentVector);
      
      // Apply content-specific adjustments
      const adjustedScore = this.applyContentAdjustments(similarity, content, userProfile);
      
      scores.set(content.id, {
        score: adjustedScore,
        explanation: this.generateExplanation(content, userProfile),
        confidence: this.calculateConfidence(similarity, content)
      });
    }
    
    return scores;
  }

  buildUserPreferenceVector(userProfile, interactions) {
    const vector = new Float32Array(100); // 100-dimensional preference space
    
    // Weight recent interactions more heavily
    const timeWeightedInteractions = interactions.map(interaction => ({
      ...interaction,
      weight: this.calculateTimeWeight(interaction.created_at) * interaction.interaction_value
    }));
    
    // Aggregate preferences by content features
    for (const interaction of timeWeightedInteractions) {
      const contentFeatures = this.getContentFeatures(interaction.content_id);
      this.addToVector(vector, contentFeatures.content_vector, interaction.weight);
    }
    
    // Normalize vector
    return this.normalizeVector(vector);
  }

  calculateCosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  applyContentAdjustments(baseSimilarity, content, userProfile) {
    let adjustedScore = baseSimilarity;
    
    // Quality threshold adjustment
    if (content.quality_score < userProfile.qualityThreshold) {
      adjustedScore *= 0.5; // Heavily penalize low-quality content
    }
    
    // Recency preference
    if (userProfile.recencyBias > 0.5) {
      adjustedScore *= (1 + content.release_recency_score * 0.2);
    }
    
    // Genre familiarity vs exploration
    const genreNovelty = this.calculateGenreNovelty(content.genres, userProfile.genrePreferences);
    if (userProfile.diversityPreference > 0.7) {
      adjustedScore *= (1 + genreNovelty * 0.3); // Boost novel genres for explorers
    } else {
      adjustedScore *= (1 - genreNovelty * 0.2); // Penalize novel genres for conservatives
    }
    
    return Math.max(0, Math.min(1, adjustedScore));
  }
}
```

#### Collaborative Filter Implementation
```javascript
// server/services/CollaborativeFilter.js
class CollaborativeFilter {
  async generateScores(userId, userProfile) {
    // Combine user-based and item-based collaborative filtering
    const [userBasedScores, itemBasedScores] = await Promise.all([
      this.userBasedFiltering(userId, userProfile),
      this.itemBasedFiltering(userId, userProfile)
    ]);
    
    // Weighted combination (60% user-based, 40% item-based)
    const combinedScores = new Map();
    
    for (const [contentId, userScore] of userBasedScores) {
      const itemScore = itemBasedScores.get(contentId) || { score: 0, confidence: 0 };
      const combinedScore = (userScore.score * 0.6) + (itemScore.score * 0.4);
      const combinedConfidence = Math.max(userScore.confidence, itemScore.confidence);
      
      combinedScores.set(contentId, {
        score: combinedScore,
        confidence: combinedConfidence,
        explanation: this.generateCFExplanation(userScore, itemScore)
      });
    }
    
    return combinedScores;
  }

  async userBasedFiltering(userId, userProfile) {
    // 1. Find similar users
    const similarUsers = await this.findSimilarUsers(userId, 50); // Top 50 similar users
    
    // 2. Get their preferences
    const scores = new Map();
    
    for (const similarUser of similarUsers) {
      const theirInteractions = await this.getUserInteractions(similarUser.user_id);
      
      for (const interaction of theirInteractions) {
        if (interaction.interaction_value > 0) { // They liked it
          const currentScore = scores.get(interaction.content_id) || { score: 0, count: 0 };
          
          // Weight by user similarity and interaction strength
          const weightedScore = similarUser.similarity * interaction.interaction_value;
          
          scores.set(interaction.content_id, {
            score: currentScore.score + weightedScore,
            count: currentScore.count + 1,
            confidence: Math.min(1, currentScore.count / 10) // More confidence with more similar users
          });
        }
      }
    }
    
    // Normalize scores
    for (const [contentId, data] of scores) {
      scores.set(contentId, {
        ...data,
        score: data.score / Math.max(1, data.count) // Average weighted score
      });
    }
    
    return scores;
  }

  async itemBasedFiltering(userId, userProfile) {
    // 1. Get user's highly-rated content
    const userFavorites = await this.getUserFavorites(userId, 4.0); // Rating >= 4.0
    
    // 2. Find content similar to their favorites
    const scores = new Map();
    
    for (const favorite of userFavorites) {
      const similarContent = await this.findSimilarContent(favorite.content_id, 20);
      
      for (const similar of similarContent) {
        const currentScore = scores.get(similar.content_id) || { score: 0, weight: 0 };
        
        // Weight by content similarity and user's rating of the source
        const weightedScore = similar.similarity * favorite.rating;
        
        scores.set(similar.content_id, {
          score: currentScore.score + weightedScore,
          weight: currentScore.weight + similar.similarity,
          confidence: Math.min(1, currentScore.weight / 5)
        });
      }
    }
    
    // Normalize scores
    for (const [contentId, data] of scores) {
      scores.set(contentId, {
        ...data,
        score: data.weight > 0 ? data.score / data.weight : 0
      });
    }
    
    return scores;
  }

  async findSimilarUsers(userId, limit = 50) {
    // Use precomputed similarity matrix or compute on-demand
    const similarUsers = await db.select({
      user_id: user_similarity.user_b_id,
      similarity: user_similarity.similarity_score
    })
    .from(user_similarity)
    .where(eq(user_similarity.user_a_id, userId))
    .orderBy(desc(user_similarity.similarity_score))
    .limit(limit);
    
    // Also check reverse direction
    const reverseUsers = await db.select({
      user_id: user_similarity.user_a_id,
      similarity: user_similarity.similarity_score
    })
    .from(user_similarity)
    .where(eq(user_similarity.user_b_id, userId))
    .orderBy(desc(user_similarity.similarity_score))
    .limit(limit);
    
    // Combine and sort
    return [...similarUsers, ...reverseUsers]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}
```

### Frontend Integration

#### Recommendation Service Hook
```javascript
// client/src/hooks/useRecommendations.js
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useRecommendations(type = 'homepage', options = {}) {
  return useQuery({
    queryKey: ['/api/recommendations', type, options],
    queryFn: () => apiRequest('/api/recommendations', {
      method: 'POST',
      body: { type, ...options }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useInfiniteRecommendations(type = 'discovery') {
  return useInfiniteQuery({
    queryKey: ['/api/recommendations/infinite', type],
    queryFn: ({ pageParam = 0 }) => 
      apiRequest(`/api/recommendations/infinite?type=${type}&offset=${pageParam}&limit=20`),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length * 20 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendationFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ recommendationId, feedback }) =>
      apiRequest(`/api/recommendations/${recommendationId}/feedback`, {
        method: 'POST',
        body: { feedback }
      }),
    onSuccess: () => {
      // Invalidate recommendations to trigger refresh
      queryClient.invalidateQueries(['/api/recommendations']);
    }
  });
}
```

#### Recommendation Components
```javascript
// client/src/components/RecommendationSection.tsx
function RecommendationSection({ type, title, className }) {
  const { data: recommendations, isLoading, error } = useRecommendations(type);
  const feedbackMutation = useRecommendationFeedback();

  const handleFeedback = (recommendationId, feedback) => {
    feedbackMutation.mutate({ recommendationId, feedback });
  };

  if (isLoading) return <RecommendationSkeleton />;
  if (error) return <RecommendationError error={error} />;
  if (!recommendations?.length) return null;

  return (
    <section className={`recommendation-section ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" data-testid={`section-title-${type}`}>
          {title}
        </h2>
        <button 
          className="text-blue-500 hover:text-blue-600 text-sm"
          data-testid={`refresh-recommendations-${type}`}
          onClick={() => queryClient.invalidateQueries(['/api/recommendations', type])}
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.content_id}
            recommendation={recommendation}
            onFeedback={handleFeedback}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ recommendation, onFeedback }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="recommendation-card group" data-testid={`recommendation-${recommendation.content_id}`}>
      <div className="relative">
        <img
          src={recommendation.content.poster_url}
          alt={recommendation.content.title}
          className="w-full aspect-[2/3] object-cover rounded-lg"
        />
        
        {/* Confidence indicator */}
        <div className="absolute top-2 right-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              recommendation.confidence > 0.8 ? 'bg-green-500' :
              recommendation.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            title={`Confidence: ${Math.round(recommendation.confidence * 100)}%`}
          />
        </div>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex flex-col justify-end p-2">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => onFeedback(recommendation.id, 1)}
              className="p-1 bg-green-500 rounded text-white text-xs"
              data-testid={`thumbs-up-${recommendation.content_id}`}
            >
              👍
            </button>
            <button
              onClick={() => onFeedback(recommendation.id, -1)}
              className="p-1 bg-red-500 rounded text-white text-xs"
              data-testid={`thumbs-down-${recommendation.content_id}`}
            >
              👎
            </button>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-1 bg-blue-500 rounded text-white text-xs"
              data-testid={`explanation-${recommendation.content_id}`}
            >
              ?
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="font-medium text-sm truncate" title={recommendation.content.title}>
          {recommendation.content.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {recommendation.content.release_year} • {recommendation.content.type}
        </p>
        
        {showExplanation && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            {recommendation.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Homepage with Multiple Recommendation Sections
```javascript
// client/src/pages/Home.tsx
function HomePage() {
  const { data: user } = useQuery({
    queryKey: ['/api/users/me']
  });

  return (
    <div className="home-page space-y-8 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Discover your next favorite show or movie</p>
      </header>

      {/* Personalized Recommendations */}
      <RecommendationSection
        type="for_you"
        title="Recommended for You"
        className="for-you-section"
      />

      {/* Because You Watched */}
      <RecommendationSection
        type="because_you_watched"
        title="Because You Watched..."
        className="because-you-watched-section"
      />

      {/* Trending Now */}
      <RecommendationSection
        type="trending"
        title="Trending Now"
        className="trending-section"
      />

      {/* Hidden Gems */}
      <RecommendationSection
        type="hidden_gems"
        title="Hidden Gems You Might Love"
        className="hidden-gems-section"
      />

      {/* Quick Picks */}
      <RecommendationSection
        type="quick_picks"
        title="Quick Picks (Under 2 Hours)"
        className="quick-picks-section"
      />

      {/* Continue Watching */}
      <RecommendationSection
        type="continue_watching"
        title="Continue Watching"
        className="continue-watching-section"
      />
    </div>
  );
}
```

## Backend API Implementation

### Recommendation Controller
```javascript
// server/routes/recommendations.js
import { RecommendationEngine } from '../services/RecommendationEngine.js';

const recommendationEngine = new RecommendationEngine();

// GET /api/recommendations - Get recommendations for current user
app.post('/api/recommendations', authenticateUser, async (req, res) => {
  try {
    const { type = 'homepage', count = 20, filters = {} } = req.body;
    const userId = req.user.id;

    const recommendations = await recommendationEngine.generateRecommendations(userId, {
      type,
      count,
      ...filters
    });

    // Track the recommendation request
    await trackRecommendationRequest(userId, type, recommendations.length);

    res.json({
      recommendations,
      generated_at: new Date().toISOString(),
      type,
      user_id: userId
    });

  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      fallback: await getFallbackRecommendations(req.user.id)
    });
  }
});

// GET /api/recommendations/infinite - Infinite scroll recommendations
app.get('/api/recommendations/infinite', authenticateUser, async (req, res) => {
  try {
    const { 
      type = 'discovery', 
      offset = 0, 
      limit = 20 
    } = req.query;
    
    const userId = req.user.id;
    const numericOffset = parseInt(offset);
    const numericLimit = Math.min(parseInt(limit), 50); // Cap at 50

    const recommendations = await recommendationEngine.generateRecommendations(userId, {
      type,
      count: numericLimit,
      offset: numericOffset,
      excludePreviouslyShown: true
    });

    const hasMore = recommendations.length === numericLimit;

    res.json({
      recommendations,
      hasMore,
      nextOffset: hasMore ? numericOffset + numericLimit : null
    });

  } catch (error) {
    console.error('Infinite recommendations error:', error);
    res.status(500).json({ error: 'Failed to load more recommendations' });
  }
});

// POST /api/recommendations/:id/feedback - User feedback on recommendation
app.post('/api/recommendations/:id/feedback', authenticateUser, async (req, res) => {
  try {
    const { id: recommendationId } = req.params;
    const { feedback } = req.body; // -1, 0, 1
    const userId = req.user.id;

    // Validate feedback value
    if (![−1, 0, 1].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' });
    }

    // Update recommendation feedback
    await db.update(user_recommendations)
      .set({ 
        feedback_score: feedback,
        updated_at: new Date()
      })
      .where(
        and(
          eq(user_recommendations.id, recommendationId),
          eq(user_recommendations.user_id, userId)
        )
      );

    // Update user profile based on feedback
    await recommendationEngine.processUserFeedback(userId, recommendationId, feedback);

    res.json({ success: true });

  } catch (error) {
    console.error('Feedback processing error:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

// GET /api/recommendations/explain/:contentId - Explain why content was recommended
app.get('/api/recommendations/explain/:contentId', authenticateUser, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const explanation = await recommendationEngine.explainRecommendation(userId, contentId);

    res.json(explanation);

  } catch (error) {
    console.error('Explanation generation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});
```

## Machine Learning Pipeline

### Model Training and Updates

#### Batch Processing for Model Updates
```javascript
// server/jobs/recommendationModelUpdater.js
class RecommendationModelUpdater {
  constructor() {
    this.schedule = {
      userSimilarity: '0 2 * * *', // Daily at 2 AM
      contentSimilarity: '0 3 * * 0', // Weekly on Sunday at 3 AM
      popularityMetrics: '0 1 * * *', // Daily at 1 AM
      userProfiles: '0 4 * * *' // Daily at 4 AM
    };
  }

  async updateUserSimilarityMatrix() {
    console.log('Starting user similarity matrix update...');
    
    // Get all active users (interacted in last 90 days)
    const activeUsers = await db.select({ id: users.id })
      .from(users)
      .innerJoin(user_interactions, eq(users.id, user_interactions.user_id))
      .where(gte(user_interactions.created_at, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
      .groupBy(users.id);

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < activeUsers.length; i += batchSize) {
      const batch = activeUsers.slice(i, i + batchSize);
      await this.processSimilarityBatch(batch);
      
      // Progress logging
      console.log(`Processed ${Math.min(i + batchSize, activeUsers.length)}/${activeUsers.length} users`);
    }

    console.log('User similarity matrix update completed');
  }

  async processSimilarityBatch(users) {
    const similarities = [];

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];

        const similarity = await this.calculateUserSimilarity(userA.id, userB.id);
        
        if (similarity > 0.1) { // Only store meaningful similarities
          similarities.push({
            user_a_id: userA.id,
            user_b_id: userB.id,
            similarity_score: similarity,
            computed_at: new Date()
          });
        }
      }
    }

    // Batch insert similarities
    if (similarities.length > 0) {
      await db.insert(user_similarity)
        .values(similarities)
        .onConflictDoUpdate({
          target: [user_similarity.user_a_id, user_similarity.user_b_id],
          set: {
            similarity_score: excluded(user_similarity.similarity_score),
            computed_at: excluded(user_similarity.computed_at)
          }
        });
    }
  }

  async calculateUserSimilarity(userAId, userBId) {
    // Get interaction vectors for both users
    const [userAInteractions, userBInteractions] = await Promise.all([
      this.getUserInteractionVector(userAId),
      this.getUserInteractionVector(userBId)
    ]);

    // Calculate Pearson correlation coefficient
    return this.calculatePearsonCorrelation(userAInteractions, userBInteractions);
  }

  async getUserInteractionVector(userId) {
    const interactions = await db.select({
      content_id: user_interactions.content_id,
      rating: user_interactions.interaction_value
    })
    .from(user_interactions)
    .where(
      and(
        eq(user_interactions.user_id, userId),
        eq(user_interactions.interaction_type, 'rate')
      )
    );

    // Convert to sparse vector representation
    const vector = new Map();
    interactions.forEach(interaction => {
      vector.set(interaction.content_id, interaction.rating);
    });

    return vector;
  }

  calculatePearsonCorrelation(vectorA, vectorB) {
    // Find common content
    const commonContent = [];
    for (const contentId of vectorA.keys()) {
      if (vectorB.has(contentId)) {
        commonContent.push({
          a: vectorA.get(contentId),
          b: vectorB.get(contentId)
        });
      }
    }

    if (commonContent.length < 3) return 0; // Need at least 3 common items

    // Calculate means
    const meanA = commonContent.reduce((sum, item) => sum + item.a, 0) / commonContent.length;
    const meanB = commonContent.reduce((sum, item) => sum + item.b, 0) / commonContent.length;

    // Calculate Pearson correlation
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (const item of commonContent) {
      const diffA = item.a - meanA;
      const diffB = item.b - meanB;
      
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }

    const denominator = Math.sqrt(denomA * denomB);
    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Schedule the jobs
const modelUpdater = new RecommendationModelUpdater();
cron.schedule(modelUpdater.schedule.userSimilarity, () => {
  modelUpdater.updateUserSimilarityMatrix();
});
```

### Real-time Learning System

#### Online Learning for Immediate Feedback
```javascript
// server/services/OnlineLearningService.js
class OnlineLearningService {
  async processUserAction(userId, action) {
    const { type, contentId, value, timestamp } = action;

    // Update user profile immediately
    await this.updateUserProfileIncremental(userId, action);

    // Update content popularity scores
    await this.updateContentPopularity(contentId, action);

    // Trigger recommendation refresh if significant change
    if (this.isSignificantAction(action)) {
      await this.invalidateUserRecommendations(userId);
    }

    // Log for batch processing
    await this.logActionForBatchProcessing(userId, action);
  }

  async updateUserProfileIncremental(userId, action) {
    const currentProfile = await this.getUserProfile(userId);
    
    // Update genre preferences based on action
    if (action.type === 'rate' && action.value >= 4) {
      const content = await this.getContent(action.contentId);
      const genreUpdate = this.calculateGenrePreferenceUpdate(
        currentProfile.genrePreferences, 
        content.genres, 
        action.value
      );
      
      await db.update(user_profiles)
        .set({ 
          favorite_genres: genreUpdate,
          updated_at: new Date()
        })
        .where(eq(user_profiles.user_id, userId));
    }

    // Update viewing patterns
    if (action.type === 'view') {
      const timePattern = this.extractTimePattern(action.timestamp);
      await this.updateViewingTimePatterns(userId, timePattern);
    }
  }

  isSignificantAction(action) {
    // High rating or completion indicates strong preference
    return (action.type === 'rate' && Math.abs(action.value) >= 4) ||
           (action.type === 'complete' && action.completion_percentage >= 0.8) ||
           (action.type === 'add_to_list');
  }

  async invalidateUserRecommendations(userId) {
    // Mark current recommendations as stale
    await db.update(user_recommendations)
      .set({ expires_at: new Date() })
      .where(
        and(
          eq(user_recommendations.user_id, userId),
          gt(user_recommendations.expires_at, new Date())
        )
      );

    // Clear cache
    await this.cache.delete(`user_profile_${userId}`);
    await this.cache.delete(`recommendations_${userId}_*`);
  }
}
```

## Performance Optimization

### Caching Strategy

#### Multi-Level Caching
```javascript
// server/services/RecommendationCache.js
class RecommendationCache {
  constructor() {
    this.memoryCache = new Map(); // In-memory for hot data
    this.redisCache = new Redis(); // Distributed cache
    this.dbCache = db; // Database cache for persistent storage
  }

  async getRecommendations(userId, type, options = {}) {
    const cacheKey = this.buildCacheKey(userId, type, options);
    
    // Level 1: Memory cache (fastest)
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data;
    }

    // Level 2: Redis cache (fast)
    const redisResult = await this.redisCache.get(cacheKey);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      if (!this.isExpired(parsed)) {
        // Populate memory cache
        this.memoryCache.set(cacheKey, parsed);
        return parsed.data;
      }
    }

    // Level 3: Database cache (persistent)
    const dbResult = await db.select()
      .from(user_recommendations)
      .where(
        and(
          eq(user_recommendations.user_id, userId),
          eq(user_recommendations.recommendation_type, type),
          gt(user_recommendations.expires_at, new Date())
        )
      )
      .orderBy(desc(user_recommendations.total_score));

    if (dbResult.length > 0) {
      const recommendations = this.formatRecommendations(dbResult);
      
      // Populate higher-level caches
      const cacheData = {
        data: recommendations,
        timestamp: new Date(),
        ttl: 30 * 60 * 1000 // 30 minutes
      };
      
      this.memoryCache.set(cacheKey, cacheData);
      await this.redisCache.setex(cacheKey, 1800, JSON.stringify(cacheData)); // 30 minutes
      
      return recommendations;
    }

    return null; // Cache miss - need to generate
  }

  async setRecommendations(userId, type, recommendations, options = {}) {
    const cacheKey = this.buildCacheKey(userId, type, options);
    const ttl = options.ttl || 30 * 60 * 1000; // Default 30 minutes
    
    const cacheData = {
      data: recommendations,
      timestamp: new Date(),
      ttl
    };

    // Store in all cache levels
    this.memoryCache.set(cacheKey, cacheData);
    await this.redisCache.setex(cacheKey, ttl / 1000, JSON.stringify(cacheData));
    
    // Store in database for persistence
    const dbRecords = recommendations.map(rec => ({
      user_id: userId,
      content_id: rec.content_id,
      total_score: rec.total_score,
      content_based_score: rec.content_based_score,
      collaborative_score: rec.collaborative_score,
      popularity_score: rec.popularity_score,
      context_score: rec.context_score,
      recommendation_type: type,
      explanation: rec.explanation,
      confidence_level: rec.confidence,
      generated_at: new Date(),
      expires_at: new Date(Date.now() + ttl)
    }));

    await db.insert(user_recommendations)
      .values(dbRecords)
      .onConflictDoNothing(); // Don't overwrite existing
  }
}
```

### Database Optimization

#### Indexing Strategy
```sql
-- Optimized indexes for recommendation queries

-- User interactions - most frequent queries
CREATE INDEX CONCURRENTLY idx_user_interactions_user_type_date 
ON user_interactions(user_id, interaction_type, created_at DESC);

CREATE INDEX CONCURRENTLY idx_user_interactions_content_value 
ON user_interactions(content_id, interaction_value) 
WHERE interaction_value >= 4; -- Only high ratings

-- Content features for similarity calculations
CREATE INDEX CONCURRENTLY idx_content_features_genres 
ON content_features USING GIN(genres);

CREATE INDEX CONCURRENTLY idx_content_features_quality_score 
ON content_features(quality_score DESC) 
WHERE quality_score >= 3.5; -- Only good content

-- Recommendations table for serving
CREATE INDEX CONCURRENTLY idx_user_recommendations_active 
ON user_recommendations(user_id, recommendation_type, expires_at, total_score DESC) 
WHERE expires_at > NOW();

-- Similarity matrices for collaborative filtering
CREATE INDEX CONCURRENTLY idx_user_similarity_score 
ON user_similarity(user_a_id, similarity_score DESC) 
WHERE similarity_score >= 0.3; -- Only meaningful similarities

CREATE INDEX CONCURRENTLY idx_content_similarity_score 
ON content_similarity(content_a_id, similarity_score DESC) 
WHERE similarity_score >= 0.3;

-- Content popularity tracking
CREATE INDEX CONCURRENTLY idx_content_popularity_trending 
ON enhanced_data(data_type, json_data->>'trending_score' DESC) 
WHERE data_type = 'popularity';
```

## Testing Strategy

### Unit Tests for Recommendation Components
```javascript
// tests/recommendation-engine.test.js
describe('RecommendationEngine', () => {
  let engine;
  let mockUser;
  let mockContent;

  beforeEach(() => {
    engine = new RecommendationEngine();
    mockUser = createMockUser();
    mockContent = createMockContent();
  });

  describe('Content-Based Filtering', () => {
    test('should recommend content similar to user preferences', async () => {
      // Given: User who likes sci-fi with high ratings
      const userProfile = {
        genrePreferences: { 'sci-fi': 0.9, 'action': 0.7 },
        qualityThreshold: 4.0
      };

      const interactions = [
        { content_id: 'blade-runner', interaction_value: 5, type: 'rate' },
        { content_id: 'matrix', interaction_value: 5, type: 'rate' }
      ];

      // When: Generate content-based recommendations
      const scores = await engine.contentBasedFilter.generateScores(userProfile, interactions);

      // Then: Should recommend high-quality sci-fi content
      const topRecommendation = Array.from(scores.entries())
        .sort((a, b) => b[1].score - a[1].score)[0];

      expect(topRecommendation[1].score).toBeGreaterThan(0.7);
      expect(scores.get('star-wars')).toBeDefined(); // Should include similar sci-fi
      expect(scores.get('romantic-comedy-low-rated')).not.toBeDefined(); // Should exclude
    });

    test('should handle genre exploration preferences', async () => {
      const exploratoryUser = {
        diversityPreference: 0.8, // High exploration
        genrePreferences: { 'drama': 0.9 }
      };

      const conservativeUser = {
        diversityPreference: 0.2, // Low exploration
        genrePreferences: { 'drama': 0.9 }
      };

      const [exploratoryScores, conservativeScores] = await Promise.all([
        engine.contentBasedFilter.generateScores(exploratoryUser, []),
        engine.contentBasedFilter.generateScores(conservativeUser, [])
      ]);

      // Exploratory user should get more diverse recommendations
      const exploratoryGenres = getGenreDistribution(exploratoryScores);
      const conservativeGenres = getGenreDistribution(conservativeScores);

      expect(exploratoryGenres.length).toBeGreaterThan(conservativeGenres.length);
    });
  });

  describe('Collaborative Filtering', () => {
    test('should find users with similar taste', async () => {
      // Given: Users with overlapping preferences
      const user1Interactions = [
        { content_id: 'content-a', rating: 5 },
        { content_id: 'content-b', rating: 4 },
        { content_id: 'content-c', rating: 5 }
      ];

      const user2Interactions = [
        { content_id: 'content-a', rating: 5 },
        { content_id: 'content-b', rating: 4 },
        { content_id: 'content-d', rating: 5 }
      ];

      // When: Calculate user similarity
      const similarity = await engine.collaborativeFilter.calculateUserSimilarity(
        user1Interactions, 
        user2Interactions
      );

      // Then: Should detect high similarity
      expect(similarity).toBeGreaterThan(0.7);
    });

    test('should recommend content liked by similar users', async () => {
      // Setup similar users and their preferences
      await setupSimilarUsers();

      const recommendations = await engine.collaborativeFilter.userBasedFiltering('user-1');

      // Should recommend content that similar users liked
      expect(recommendations.get('content-liked-by-similar-users')).toBeDefined();
      expect(recommendations.get('content-disliked-by-similar-users')).not.toBeDefined();
    });
  });

  describe('Hybrid Combination', () => {
    test('should properly weight different recommendation sources', async () => {
      const mockScores = {
        contentBased: new Map([['content-1', { score: 0.8, confidence: 0.9 }]]),
        collaborative: new Map([['content-1', { score: 0.6, confidence: 0.7 }]]),
        popularity: new Map([['content-1', { score: 0.9, confidence: 1.0 }]]),
        context: new Map([['content-1', { score: 0.7, confidence: 0.8 }]])
      };

      const combined = engine.hybridCombiner.combineScores(mockScores, mockUser);

      // Should be weighted average: 0.8*0.4 + 0.6*0.35 + 0.9*0.15 + 0.7*0.1 = 0.735
      expect(combined.get('content-1').score).toBeCloseTo(0.735, 2);
    });

    test('should handle missing scores gracefully', async () => {
      const partialScores = {
        contentBased: new Map([['content-1', { score: 0.8, confidence: 0.9 }]]),
        collaborative: new Map(), // Empty
        popularity: new Map([['content-1', { score: 0.9, confidence: 1.0 }]]),
        context: new Map() // Empty
      };

      const combined = engine.hybridCombiner.combineScores(partialScores, mockUser);

      // Should still produce valid recommendations
      expect(combined.get('content-1')).toBeDefined();
      expect(combined.get('content-1').score).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should generate complete recommendation pipeline', async () => {
      const userId = 'test-user-1';
      
      // Setup user with interaction history
      await setupUserWithHistory(userId);

      // Generate recommendations
      const recommendations = await engine.generateRecommendations(userId, {
        count: 10,
        type: 'homepage'
      });

      // Verify output structure and quality
      expect(recommendations).toHaveLength(10);
      expect(recommendations[0]).toHaveProperty('content_id');
      expect(recommendations[0]).toHaveProperty('total_score');
      expect(recommendations[0]).toHaveProperty('explanation');
      expect(recommendations[0]).toHaveProperty('confidence');

      // Verify score ordering
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].total_score).toBeGreaterThanOrEqual(
          recommendations[i].total_score
        );
      }
    });
  });
});
```

### A/B Testing Framework
```javascript
// server/services/ABTestingService.js
class ABTestingService {
  constructor() {
    this.experiments = new Map();
    this.loadActiveExperiments();
  }

  async assignUserToExperiment(userId, experimentName) {
    const experiment = this.experiments.get(experimentName);
    if (!experiment || !experiment.active) return 'control';

    // Consistent assignment based on user ID hash
    const hash = this.hashUserId(userId);
    const bucket = hash % 100;

    if (bucket < experiment.trafficAllocation.control) {
      return 'control';
    } else if (bucket < experiment.trafficAllocation.control + experiment.trafficAllocation.variant) {
      return 'variant';
    }
    
    return 'control'; // Default fallback
  }

  async trackRecommendationExperiment(userId, experimentName, variant, metrics) {
    await db.insert(ab_test_events).values({
      user_id: userId,
      experiment_name: experimentName,
      variant: variant,
      event_type: 'recommendation_served',
      metrics: JSON.stringify(metrics),
      timestamp: new Date()
    });
  }

  async getRecommendationAlgorithm(userId) {
    const algorithmVariant = await this.assignUserToExperiment(userId, 'recommendation_algorithm_v2');
    
    switch (algorithmVariant) {
      case 'variant':
        return new EnhancedRecommendationEngine(); // New algorithm
      case 'control':
      default:
        return new RecommendationEngine(); // Current algorithm
    }
  }
}
```

## Deployment and Monitoring

### Performance Monitoring
```javascript
// server/middleware/recommendationMetrics.js
class RecommendationMetrics {
  constructor() {
    this.metrics = {
      generationTime: new Map(),
      cacheHitRate: { hits: 0, misses: 0 },
      userFeedback: { positive: 0, negative: 0, neutral: 0 },
      apiLatency: [],
      errorRate: 0
    };
  }

  trackRecommendationGeneration(userId, type, startTime, endTime, cacheHit) {
    const duration = endTime - startTime;
    
    // Track generation time
    if (!this.metrics.generationTime.has(type)) {
      this.metrics.generationTime.set(type, []);
    }
    this.metrics.generationTime.get(type).push(duration);

    // Track cache performance
    if (cacheHit) {
      this.metrics.cacheHitRate.hits++;
    } else {
      this.metrics.cacheHitRate.misses++;
    }

    // Log slow generations
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow recommendation generation: ${duration}ms for user ${userId}, type ${type}`);
    }
  }

  trackUserFeedback(feedback) {
    if (feedback > 0) this.metrics.userFeedback.positive++;
    else if (feedback < 0) this.metrics.userFeedback.negative++;
    else this.metrics.userFeedback.neutral++;
  }

  getMetricsSummary() {
    const cacheHitRate = this.metrics.cacheHitRate.hits / 
      (this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses);

    const avgGenerationTimes = {};
    for (const [type, times] of this.metrics.generationTime) {
      avgGenerationTimes[type] = times.reduce((a, b) => a + b, 0) / times.length;
    }

    const totalFeedback = Object.values(this.metrics.userFeedback).reduce((a, b) => a + b, 0);
    const positiveRate = totalFeedback > 0 ? this.metrics.userFeedback.positive / totalFeedback : 0;

    return {
      cacheHitRate,
      avgGenerationTimes,
      positiveRate,
      errorRate: this.metrics.errorRate,
      lastUpdated: new Date()
    };
  }
}

// Metrics endpoint
app.get('/api/admin/recommendation-metrics', authenticateAdmin, (req, res) => {
  const metrics = recommendationMetrics.getMetricsSummary();
  res.json(metrics);
});
```

This comprehensive implementation guide provides everything needed to build a sophisticated hybrid recommendation system that learns from user behavior and continuously improves its suggestions over time.