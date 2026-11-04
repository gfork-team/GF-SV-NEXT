/**
 * 动态内容模块配置（`src/lib/dynamic/`）
 *
 * 分工约定：
 * - 端点：已经在 `config.json` / 其它配置模块里有的，一律沿用，不在这里重复定义
 *   （lookup 节点 → `lookupNodes`，info → `infoApi`，下载节点 → `downloadNodes`，
 *   跳转延时 → `redirects`）。这里只补「目前只有动态模块用」的两个端点。
 * - 策略：超时 / 重试 / 缓存 / 占位行数等一律集中在这里，模块内不得硬编码。
 *
 * 缓存只用于「二次访问」：它在浏览器里、水合之后才生效，
 * 冷加载（无 JS 状态、无缓存）永远走构建期写进 HTML 的默认内容。
 */
export const dynamicConfig = {
	/** 端点 */
	endpoints: {
		/** 镜像探活：Cloudflare Worker 侧实现，只读响应头 */
		mirror: '/ping',
		/** 用户出口 IP 回显（下载测速的缓存键需要它） */
		ipTrace: 'https://www.cloudflare.com/cdn-cgi/trace'
	},

	/** 单次请求超时（毫秒） */
	timeout: {
		lookup: 15000,
		suggestions: 8000,
		info: 5000,
		mirror: 3000,
		ip: 3000,
		download: 2000
	},

	/** 重试：attempts 含首次；delaysMs[i] 是第 i+1 次重试前的等待 */
	retry: {
		attempts: 3,
		delaysMs: [600, 1500]
	},

	/** 内存 TTL 缓存（秒）；0 = 关闭 */
	cache: {
		ttlSec: 60
	},

	/** 列表区块：构建期写进 HTML 的占位行数 */
	list: {
		/**
		 * 构建期预渲染的占位行数。
		 * 列表页冷加载时先把整页高度铺满（100 行），API 返回后直接换文字、
		 * 多余的占位行随真实行数一起消失 —— 这样从骨架到内容不会有高度跳变。
		 * 加载期间由区块自己的遮罩盖住视口可见区域，避免看到一片占位卡片。
		 */
		placeholderRows: 100,
		/**
		 * 搜索请求的每页条数。新版接口返回裸数组、不再带 options.per_page，
		 * 只有显式请求这个值才能可靠判断「还有没有下一页」。
		 * 它只进请求参数，不进 hash（URL 格式保持不变）。
		 */
		perPage: 100
	},

	/** 倒计时区块的节拍（毫秒） */
	countdown: {
		tickMs: 1000
	},

	/** 去抖：hash 变化 / 搜索输入 */
	debounceMs: {
		hash: 100,
		input: 300
	},

	/** 长时间停留时的后台刷新间隔（秒）；0 = 不刷新 */
	refresh: {
		mirrorSec: 60
	},

	/** 下载测速流程内的等待（毫秒）：节点之间 / 选中最优后落定 */
	download: {
		gapMs: 300,
		settleMs: 500
	}
} as const;

export type DynamicConfig = typeof dynamicConfig;
