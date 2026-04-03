/**
 * Echo SDK Gateway — OpenAPI 3.1 specification.
 *
 * Self-hosted at GET /openapi.json for ChatGPT GPT Actions "Import from URL".
 * Covers all 28 gateway endpoints across 8 service domains.
 */

export function getOpenApiSpec(version: string): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Echo SDK Gateway',
      version,
      description:
        'Unified REST API for Echo Omega Prime. Access 2,660+ intelligence engines across 210+ domains, ' +
        'semantic memory (Shared Brain), knowledge base (Knowledge Forge), credential vault, and any Echo Worker. ' +
        'All responses use canonical envelope: {success, data, error, meta}.',
      contact: { name: 'Echo Prime Technologies', url: 'https://echo-ept.com' },
    },
    servers: [{ url: 'https://echo-sdk-gateway.bmcii1976.workers.dev', description: 'Production' }],
    security: [{ apiKey: [] }],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Echo-API-Key',
          description: 'API key for authentication. Also accepts Authorization: Bearer <key>.',
        },
      },
      schemas: {
        Envelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { description: 'Response payload (null on error)' },
            error: {
              type: ['object', 'null'],
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                ts: { type: 'string', format: 'date-time' },
                version: { type: 'string' },
                service: { type: 'string' },
                latency_ms: { type: 'number' },
              },
            },
          },
        },
      },
    },
    paths: {
      // ===== ENGINE ROUTES =====
      '/engine/query': {
        post: {
          operationId: 'engineQuery',
          summary: 'Query a specific engine by ID',
          description:
            'Send a natural-language query to a specific intelligence engine (e.g., LG02 for Case Law Research, ' +
            'TX14 for Crypto Tax, AERO01 for Aviation). Returns doctrine-backed analysis.',
          tags: ['Engines'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['engine_id', 'query'],
                  properties: {
                    engine_id: {
                      type: 'string',
                      description: 'Engine identifier (e.g., LG02, TX14, AERO01, ACCT05)',
                      example: 'LG02',
                    },
                    query: { type: 'string', description: 'Natural-language query', example: 'What is the statute of limitations for breach of contract in Texas?' },
                    mode: {
                      type: 'string',
                      enum: ['FAST', 'DEFENSE', 'MEMO'],
                      default: 'FAST',
                      description: 'Response mode: FAST (concise), DEFENSE (audit-ready), MEMO (full documentation)',
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Engine query result wrapped in canonical envelope' } },
        },
      },
      '/engine/domain': {
        post: {
          operationId: 'engineDomainQuery',
          summary: 'Query an entire domain category',
          description:
            'Query all engines within a domain category (e.g., ACCT for Accounting, LG for Legal, TX for Tax). ' +
            'Returns aggregated results from all engines in that domain.',
          tags: ['Engines'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['domain', 'query'],
                  properties: {
                    domain: {
                      type: 'string',
                      description: 'Domain category code (e.g., ACCT, AERO, AGLAW, LG, TX)',
                      example: 'TX',
                    },
                    query: { type: 'string', description: 'Natural-language query' },
                    mode: { type: 'string', enum: ['FAST', 'DEFENSE', 'MEMO'], default: 'FAST' },
                    cross_domain: {
                      type: 'boolean',
                      default: true,
                      description: 'Whether to include cross-domain matches',
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Domain query result wrapped in canonical envelope' } },
        },
      },
      '/engine/cross-domain': {
        post: {
          operationId: 'engineCrossDomainQuery',
          summary: 'Cross-domain query across ALL engines',
          description:
            'Query across all 2,660+ engines and 210+ domains simultaneously. Returns the most relevant ' +
            'results ranked by doctrine match score.',
          tags: ['Engines'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Natural-language query' },
                    mode: { type: 'string', enum: ['FAST', 'DEFENSE', 'MEMO'], default: 'FAST' },
                    limit: { type: 'integer', default: 15, maximum: 50, description: 'Max results to return' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Cross-domain results wrapped in canonical envelope' } },
        },
      },
      '/engine/search': {
        get: {
          operationId: 'engineSearch',
          summary: 'Search engines by keyword',
          description: 'Hybrid keyword + semantic search across all engine names, descriptions, and domains.',
          tags: ['Engines'],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 }, description: 'Max results' },
          ],
          responses: { '200': { description: 'Search results wrapped in canonical envelope' } },
        },
      },
      '/engine/domains': {
        get: {
          operationId: 'engineListDomains',
          summary: 'List all 210+ domain categories',
          description: 'Returns all domain categories with engine counts and descriptions.',
          tags: ['Engines'],
          responses: { '200': { description: 'Domain list wrapped in canonical envelope' } },
        },
      },
      '/engine/stats': {
        get: {
          operationId: 'engineStats',
          summary: 'Full engine runtime statistics',
          description: 'Returns total engine count, doctrine count, domain count, query stats, and uptime.',
          tags: ['Engines'],
          responses: { '200': { description: 'Engine stats wrapped in canonical envelope' } },
        },
      },
      '/engine/{id}': {
        get: {
          operationId: 'engineDetail',
          summary: 'Get engine detail by ID',
          description: "Returns a specific engine's configuration, doctrine count, and domain info.",
          tags: ['Engines'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Engine ID (e.g., LG02, TX14) or domain category (e.g., ACCT, AERO)',
            },
          ],
          responses: { '200': { description: 'Engine detail wrapped in canonical envelope' } },
        },
      },

      // ===== BRAIN ROUTES =====
      '/brain/search': {
        post: {
          operationId: 'brainSearch',
          summary: 'Search shared memory',
          description: 'Semantic search across all stored memories, decisions, and context across all AI instances.',
          tags: ['Brain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    limit: { type: 'integer', default: 10, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Search results wrapped in canonical envelope' } },
        },
      },
      '/brain/ingest': {
        post: {
          operationId: 'brainIngest',
          summary: 'Store a memory',
          description: 'Store a decision, fact, event, or context into the shared brain for cross-session recall.',
          tags: ['Brain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string', description: 'Memory content to store' },
                    instance_id: { type: 'string', default: 'echo-sdk-gateway' },
                    role: { type: 'string', default: 'assistant' },
                    importance: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Ingest confirmation wrapped in canonical envelope' } },
        },
      },
      '/brain/context': {
        post: {
          operationId: 'brainContext',
          summary: 'Get conversation context',
          description: 'Retrieve contextual memories relevant to a query for a specific instance.',
          tags: ['Brain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['instance_id'],
                  properties: {
                    instance_id: { type: 'string' },
                    query: { type: 'string' },
                    conversation_id: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Context data wrapped in canonical envelope' } },
        },
      },
      '/brain/heartbeat': {
        post: {
          operationId: 'brainHeartbeat',
          summary: 'Register instance heartbeat',
          description: 'Signal that an AI instance is alive and report its current task.',
          tags: ['Brain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['instance_id'],
                  properties: {
                    instance_id: { type: 'string' },
                    current_task: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Heartbeat acknowledgment wrapped in canonical envelope' } },
        },
      },

      // ===== KNOWLEDGE ROUTES =====
      '/knowledge/search': {
        post: {
          operationId: 'knowledgeSearch',
          summary: 'Search knowledge base',
          description: 'Search across 5,387+ documents and 75K+ chunks in the Knowledge Forge.',
          tags: ['Knowledge'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    category: { type: 'string', description: 'Filter by category (e.g., tax, legal, oilfield)' },
                    limit: { type: 'integer', default: 10, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Search results wrapped in canonical envelope' } },
        },
      },
      '/knowledge/ingest': {
        post: {
          operationId: 'knowledgeIngest',
          summary: 'Ingest a document',
          description: 'Add a new document to the Knowledge Forge for future retrieval.',
          tags: ['Knowledge'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string', description: 'Document content' },
                    title: { type: 'string', default: 'Untitled' },
                    category: { type: 'string', default: 'general' },
                    source: { type: 'string', default: 'sdk-gateway' },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Ingest confirmation wrapped in canonical envelope' } },
        },
      },

      // ===== SEARCH ROUTES (ULTRAFAST 3-LAYER) =====
      '/search': {
        post: {
          operationId: 'unifiedSearch',
          summary: 'Ultrafast unified search across all sources',
          description:
            '3-layer ultrafast search: Layer 1 KV cache (<5ms) → Layer 2 Vectorize+FTS5 (20-50ms) → ' +
            'Layer 3 parallel backend fan-out (80-200ms). Searches engines, knowledge, and brain simultaneously ' +
            'with hybrid semantic+keyword ranking.',
          tags: ['Search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Search query', example: 'cryptocurrency tax deductions' },
                    limit: { type: 'integer', default: 20, maximum: 100, description: 'Max results to return' },
                    sources: {
                      type: 'array',
                      items: { type: 'string', enum: ['engine', 'knowledge', 'brain'] },
                      description: 'Filter to specific sources. Omit for all sources.',
                    },
                    mode: {
                      type: 'string',
                      enum: ['FAST', 'DEEP'],
                      default: 'FAST',
                      description: 'FAST skips Layer 3 backend fan-out. DEEP uses all 3 layers.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Unified search results with performance telemetry',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          results: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                source: { type: 'string', enum: ['engine', 'knowledge', 'brain'] },
                                title: { type: 'string' },
                                snippet: { type: 'string' },
                                category: { type: 'string' },
                                score: { type: 'number' },
                                rank_source: { type: 'string' },
                              },
                            },
                          },
                          total: { type: 'integer' },
                          query: { type: 'string' },
                          performance: {
                            type: 'object',
                            properties: {
                              cache_hit: { type: 'boolean' },
                              total_ms: { type: 'number' },
                              layer_stats: { type: 'object' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          operationId: 'unifiedSearchGet',
          summary: 'Ultrafast unified search (GET variant)',
          description: 'Same as POST /search but via query parameters. Convenient for browser testing and GPT Actions.',
          tags: ['Search'],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'sources', in: 'query', schema: { type: 'string' }, description: 'Comma-separated: engine,knowledge,brain' },
            { name: 'mode', in: 'query', schema: { type: 'string', enum: ['FAST', 'DEEP'], default: 'FAST' } },
          ],
          responses: { '200': { description: 'Unified search results with performance telemetry' } },
        },
      },
      '/search/engines': {
        post: {
          operationId: 'searchEnginesCached',
          summary: 'Cached engine search',
          description: 'Search engines with KV cache layer. Same as /engine/search but with <5ms cache hits.',
          tags: ['Search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    limit: { type: 'integer', default: 10, maximum: 50 },
                    mode: { type: 'string', enum: ['FAST', 'DEFENSE', 'MEMO'], default: 'FAST' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Engine search results (cached)' } },
        },
      },
      '/search/knowledge': {
        post: {
          operationId: 'searchKnowledgeCached',
          summary: 'Cached knowledge search',
          description: 'Search Knowledge Forge with KV cache layer. <5ms on cache hit.',
          tags: ['Search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    category: { type: 'string' },
                    limit: { type: 'integer', default: 10, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Knowledge search results (cached)' } },
        },
      },
      '/search/brain': {
        post: {
          operationId: 'searchBrainCached',
          summary: 'Cached brain search',
          description: 'Search Shared Brain with KV cache layer. <5ms on cache hit, 2min TTL.',
          tags: ['Search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    limit: { type: 'integer', default: 10, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Brain search results (cached)' } },
        },
      },
      '/search/stats': {
        get: {
          operationId: 'searchStats',
          summary: 'Search cache and performance statistics',
          description: 'Returns D1 index stats, Vectorize index info, and search performance metrics.',
          tags: ['Search'],
          responses: { '200': { description: 'Search infrastructure statistics' } },
        },
      },

      // ===== VAULT ROUTES =====
      '/vault/get': {
        post: {
          operationId: 'vaultGet',
          summary: 'Retrieve a credential',
          description: 'Look up a stored credential by service name from the encrypted vault.',
          tags: ['Vault'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['service'],
                  properties: {
                    service: { type: 'string', description: 'Service/credential name to retrieve', example: 'github-echo-omega-prime' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Credential data wrapped in canonical envelope' } },
        },
      },

      // ===== WORKER ROUTES =====
      '/worker/call': {
        post: {
          operationId: 'workerCall',
          summary: 'Call any Echo Worker',
          description:
            'Generic proxy to call any Echo Worker endpoint by name. Supports any Worker in the *.bmcii1976.workers.dev domain.',
          tags: ['Worker'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['worker'],
                  properties: {
                    worker: {
                      type: 'string',
                      description: 'Worker name (e.g., echo-chat) or full URL',
                      example: 'echo-chat',
                    },
                    path: { type: 'string', default: '/', description: 'Endpoint path on the worker' },
                    method: { type: 'string', default: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
                    body: { type: 'object', description: 'Request body (for POST/PUT)' },
                    timeout_ms: { type: 'integer', default: 15000, maximum: 30000 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Worker response wrapped in canonical envelope' } },
        },
      },

      // ===== SDK CATALOG ROUTES =====
      '/sdk/catalog': {
        get: {
          operationId: 'sdkCatalogList',
          summary: 'List all SDK methods (paginated)',
          description:
            'Browse the full SDK method catalog (221 methods across 30 modules). ' +
            'Supports pagination and optional module filtering.',
          tags: ['SDK'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 }, description: 'Max results per page' },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Pagination offset' },
            { name: 'module', in: 'query', schema: { type: 'string' }, description: 'Filter by module name (e.g., voice, brain, engine)' },
          ],
          responses: { '200': { description: 'Paginated method list wrapped in canonical envelope' } },
        },
      },
      '/sdk/catalog/modules': {
        get: {
          operationId: 'sdkCatalogModules',
          summary: 'List all SDK modules with method counts',
          description: 'Returns all 30 modules grouped by class name with method counts.',
          tags: ['SDK'],
          responses: { '200': { description: 'Module list with counts wrapped in canonical envelope' } },
        },
      },
      '/sdk/catalog/search': {
        get: {
          operationId: 'sdkCatalogSearch',
          summary: 'Search SDK methods by keyword',
          description:
            'Full-text search across method names, descriptions, modules, and return types. ' +
            'Results prioritize method name matches.',
          tags: ['SDK'],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 }, description: 'Search query (min 2 chars)' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 }, description: 'Max results' },
          ],
          responses: { '200': { description: 'Search results wrapped in canonical envelope' } },
        },
      },
      '/sdk/catalog/method/{name}': {
        get: {
          operationId: 'sdkCatalogMethod',
          summary: 'Get a specific SDK method by name',
          description: 'Look up a single method by its exact name. May return multiple results if the method exists in multiple modules.',
          tags: ['SDK'],
          parameters: [
            { name: 'name', in: 'path', required: true, schema: { type: 'string' }, description: 'Exact method name (e.g., cloneVoice, store, query)' },
          ],
          responses: {
            '200': { description: 'Method details wrapped in canonical envelope' },
            '404': { description: 'Method not found' },
          },
        },
      },
      '/sdk/catalog/{module}': {
        get: {
          operationId: 'sdkCatalogModule',
          summary: 'Get all methods for a specific module',
          description: 'Returns all methods within a module (e.g., voice, brain, engine, crypto) with class names.',
          tags: ['SDK'],
          parameters: [
            { name: 'module', in: 'path', required: true, schema: { type: 'string' }, description: 'Module name (e.g., voice, brain, engine)' },
          ],
          responses: {
            '200': { description: 'Module methods wrapped in canonical envelope' },
            '404': { description: 'Module not found' },
          },
        },
      },

      // ===== SYSTEM ROUTES =====
      '/health': {
        get: {
          operationId: 'healthCheck',
          summary: 'Gateway health check',
          description: 'Returns gateway status, version, and timestamp. No authentication required.',
          tags: ['System'],
          security: [],
          responses: {
            '200': {
              description: 'Health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'healthy' },
                          version: { type: 'string' },
                          timestamp: { type: 'string', format: 'date-time' },
                          services: { type: 'object' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/openapi.json': {
        get: {
          operationId: 'getOpenApiSpec',
          summary: 'OpenAPI specification',
          description: 'Returns this OpenAPI 3.1 spec. Use "Import from URL" in GPT editor.',
          tags: ['System'],
          security: [],
          responses: { '200': { description: 'OpenAPI 3.1 JSON spec' } },
        },
      },
    },
    tags: [
      { name: 'Engines', description: '2,660+ intelligence engines across 210+ domains with 510,644 doctrines' },
      { name: 'Brain', description: 'Shared Brain — infinite semantic memory across all AI instances' },
      { name: 'Knowledge', description: 'Knowledge Forge — 5,387+ documents, 75K+ chunks, 140+ categories' },
      { name: 'Search', description: 'Ultrafast 3-layer unified search: KV cache (<5ms) → Vectorize+FTS5 (20-50ms) → parallel fan-out (80-200ms)' },
      { name: 'Vault', description: 'Encrypted credential vault (91+ credentials, 22 categories)' },
      { name: 'Worker', description: 'Generic proxy to call any Echo Worker by name' },
      { name: 'SDK', description: 'SDK method catalog — 221 methods across 30 modules' },
      { name: 'System', description: 'Health checks, OpenAPI spec, gateway status' },
    ],
  };
}
