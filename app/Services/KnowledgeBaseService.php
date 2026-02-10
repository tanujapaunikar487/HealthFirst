<?php

namespace App\Services;

use App\Models\KnowledgeBaseResource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class KnowledgeBaseService
{
    /**
     * Search knowledge base resources.
     *
     * @param  string  $query  Search query
     * @param  array  $options  Search options (category, limit, etc.)
     * @return Collection Collection of resources
     */
    public function search(string $query, array $options = []): Collection
    {
        if (! config('ai.knowledge_base.enabled')) {
            return collect([]);
        }

        $category = $options['category'] ?? null;
        $limit = $options['limit'] ?? 5;
        $cacheKey = 'kb_search:'.md5($query.$category.$limit);
        $cacheTtl = config('ai.knowledge_base.cache_ttl', 3600);

        return Cache::remember($cacheKey, $cacheTtl, function () use ($query, $category, $limit) {
            $queryBuilder = KnowledgeBaseResource::active()->byPriority();

            // Add category filter if specified
            if ($category) {
                $queryBuilder->category($category);
            }

            // Perform full-text search
            $resources = $queryBuilder->search($query)
                ->limit($limit)
                ->get();

            // If full-text search returns no results, try keyword matching
            if ($resources->isEmpty()) {
                $resources = $this->keywordSearch($query, $category, $limit);
            }

            return $resources;
        });
    }

    /**
     * Keyword-based search fallback.
     */
    private function keywordSearch(string $query, ?string $category, int $limit): Collection
    {
        $keywords = explode(' ', strtolower($query));

        $queryBuilder = KnowledgeBaseResource::active()->byPriority();

        if ($category) {
            $queryBuilder->category($category);
        }

        $queryBuilder->where(function ($q) use ($keywords) {
            foreach ($keywords as $keyword) {
                $q->orWhere('title', 'like', "%{$keyword}%")
                    ->orWhere('summary', 'like', "%{$keyword}%")
                    ->orWhere('content', 'like', "%{$keyword}%");
            }
        });

        return $queryBuilder->limit($limit)->get();
    }

    /**
     * Get resources by tags.
     *
     * @param  array  $tags  Array of tags to search
     * @param  array  $options  Search options
     */
    public function getByTags(array $tags, array $options = []): Collection
    {
        $category = $options['category'] ?? null;
        $limit = $options['limit'] ?? 5;

        $queryBuilder = KnowledgeBaseResource::active()->byPriority();

        if ($category) {
            $queryBuilder->category($category);
        }

        foreach ($tags as $tag) {
            $queryBuilder->orWhereJsonContains('tags', $tag);
        }

        return $queryBuilder->limit($limit)->get();
    }

    /**
     * Get resources by category.
     *
     * @param  string  $category  Category name
     * @param  int  $limit  Maximum number of resources
     */
    public function getByCategory(string $category, int $limit = 10): Collection
    {
        return KnowledgeBaseResource::active()
            ->category($category)
            ->byPriority()
            ->limit($limit)
            ->get();
    }

    /**
     * Get a single resource by slug.
     *
     * @param  string  $slug  Resource slug
     */
    public function getBySlug(string $slug): ?KnowledgeBaseResource
    {
        return KnowledgeBaseResource::active()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Format resources for AI context.
     *
     * Formats resources to be included in AI prompts.
     *
     * @param  Collection  $resources  Collection of resources
     * @param  int  $maxLength  Maximum total character length
     * @return array Array of formatted resources
     */
    public function formatForAI(Collection $resources, int $maxLength = 4000): array
    {
        $formatted = [];
        $currentLength = 0;

        foreach ($resources as $resource) {
            $text = "{$resource->title}\n\n{$resource->content}";
            $textLength = strlen($text);

            // Stop if adding this resource would exceed max length
            if ($currentLength + $textLength > $maxLength) {
                // Try to add just the summary if available
                if ($resource->summary) {
                    $summaryText = "{$resource->title}\n\n{$resource->summary}";
                    if ($currentLength + strlen($summaryText) <= $maxLength) {
                        $formatted[] = [
                            'title' => $resource->title,
                            'content' => $resource->summary,
                            'category' => $resource->category,
                        ];
                        $currentLength += strlen($summaryText);
                    }
                }

                continue;
            }

            $formatted[] = [
                'title' => $resource->title,
                'content' => $resource->content,
                'category' => $resource->category,
            ];

            $currentLength += $textLength;
        }

        return $formatted;
    }

    /**
     * Create or update a knowledge base resource.
     *
     * @param  array  $data  Resource data
     */
    public function createOrUpdate(array $data): KnowledgeBaseResource
    {
        if (isset($data['slug'])) {
            $resource = KnowledgeBaseResource::where('slug', $data['slug'])->first();
            if ($resource) {
                $resource->update($data);

                return $resource;
            }
        }

        return KnowledgeBaseResource::create($data);
    }

    /**
     * Delete a resource.
     *
     * @param  string  $slug  Resource slug
     */
    public function delete(string $slug): bool
    {
        $resource = KnowledgeBaseResource::where('slug', $slug)->first();
        if ($resource) {
            return $resource->delete();
        }

        return false;
    }

    /**
     * Clear knowledge base cache.
     */
    public function clearCache(): void
    {
        Cache::tags(['knowledge_base'])->flush();
    }
}
