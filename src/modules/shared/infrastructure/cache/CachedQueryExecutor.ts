import { appLogger } from '../../../../app/server/logging';
import type { CacheQueryType } from './CachePolicyResolver';
import { CachePolicyResolver } from './CachePolicyResolver';
import type { CacheService } from './CacheService';

export class CachedQueryExecutor {
  public constructor(
    private readonly cacheService: CacheService,
    private readonly cachePolicyResolver: CachePolicyResolver,
  ) {}

  public async execute<T>(params: {
    cacheKey: string;
    queryType: CacheQueryType;
    loader: () => Promise<T>;
    bypass?: boolean;
  }): Promise<T> {
    if (!this.cachePolicyResolver.isEnabled() || params.bypass) {
      appLogger.info({
        eventType: 'cache_bypass',
        message: 'Cache bypassed',
        status: 'completed',
        context: {
          cacheKey: params.cacheKey,
          queryType: params.queryType,
          cacheEnabled: this.cachePolicyResolver.isEnabled(),
          bypass: params.bypass ?? false,
        },
      });

      return params.loader();
    }

    try {
      const cached = await this.cacheService.get<T>(params.cacheKey);

      if (cached !== null) {
        appLogger.info({
          eventType: 'cache_hit',
          message: 'Cache hit',
          status: 'completed',
          context: {
            cacheKey: params.cacheKey,
            queryType: params.queryType,
          },
        });

        return cached;
      }

      appLogger.info({
        eventType: 'cache_miss',
        message: 'Cache miss',
        status: 'completed',
        context: {
          cacheKey: params.cacheKey,
          queryType: params.queryType,
        },
      });
    } catch (error) {
      appLogger.error({
        eventType: 'cache_read_error',
        message: 'Cache read failed',
        status: 'failed',
        context: {
          cacheKey: params.cacheKey,
          queryType: params.queryType,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        },
      });
    }

    const result = await params.loader();

    try {
      await this.cacheService.set(
        params.cacheKey,
        result,
        this.cachePolicyResolver.getTtlSeconds(params.queryType),
      );
    } catch (error) {
      appLogger.error({
        eventType: 'cache_write_error',
        message: 'Cache write failed',
        status: 'failed',
        context: {
          cacheKey: params.cacheKey,
          queryType: params.queryType,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        },
      });
    }

    return result;
  }
}
