<script lang="ts">
	import { onMount } from 'svelte';
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';

	let { lang, delaySec, buildUrl, showAds = false }: { lang: Lang; delaySec: number; buildUrl: (lang: Lang) => string; showAds?: boolean } = $props();

	let waitTemplate = $derived(t(lang, 'redirect.waiting'));
	let loadingText = $derived(t(lang, 'redirect.loading'));
	let skipText = $derived(t(lang, 'redirect.skip'));

	onMount(() => {
		let targetUrl = buildUrl(lang);
		const updateTarget = () => { targetUrl = buildUrl(lang); };
		const textEl = document.getElementById('redirect-countdown-text')!;

		// 等待时间为 0：不做倒计时，立即跳转
		if (delaySec <= 0) {
			window.location.assign(targetUrl);
			return;
		}

		let countdown = delaySec;

		function tick() {
			countdown--;
			// 倒计时显示到 1 秒时立即开始跳转
			if (countdown <= 1) {
				clearInterval(interval);
				textEl.textContent = loadingText;
				window.location.assign(targetUrl);
				return;
			}
			textEl.textContent = waitTemplate.replace('{countdown}', String(countdown));
		}

		window.addEventListener('hashchange', updateTarget);
		textEl.textContent = waitTemplate.replace('{countdown}', String(countdown));
		const interval = setInterval(tick, 1000);

		return () => {
			clearInterval(interval);
			window.removeEventListener('hashchange', updateTarget);
		};
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
	<title>{t(lang, 'redirect.title')}</title>
</svelte:head>

<div class="rd-page">
	<div class="rd-keywords-bg">
		<div class="rd-kw-col">
			<span>CDN加速</span><span>云网络</span><span>边缘节点</span><span>代理服务器</span><span>住宅IP</span><span>静态代理</span><span>动态代理</span><span>VPN隧道</span><span>协议优化</span><span>负载均衡</span><span>反向代理</span>
		</div>
		<div class="rd-kw-col">
			<span>智能路由</span><span>数据加速</span><span>跨境网络</span><span>安全传输</span><span>低延迟</span><span>高可用</span><span>分布式节点</span><span>全球加速</span><span>专线代理</span><span>SOCKS5</span><span>HTTP代理</span>
		</div>
		<div class="rd-kw-col">
			<span>Shadowsocks</span><span>V2Ray</span><span>Trojan</span><span>WireGuard</span><span>Cloudflare Tunnel</span><span>网络优化</span><span>带宽聚合</span><span>链路聚合</span><span>多线BGP</span><span>边缘计算</span><span>隧道协议</span>
		</div>
		<div class="rd-kw-col">
			<span>CDN节点</span><span>内容分发</span><span>全球负载</span><span>智能DNS</span><span>流量调度</span><span>Anycast</span><span>零信任</span><span>端到端加密</span><span>传输优化</span><span>加速通道</span><span>高速通道</span>
		</div>
	</div>

	<div class="rd-card">
		<div class="rd-card-glow"></div>
		<div class="rd-card-content">
			<span class="rd-spin-icon material-icons">refresh</span>
			<p id="redirect-countdown-text" class="rd-countdown">{waitTemplate.replace('{countdown}', String(delaySec))}</p>

			{#if showAds}
			<div class="rd-ad-slot"><Ad type="auto" /></div>
			{/if}

			<div class="rd-kw-block">
				<span>CDN加速</span><span>代理服务器</span><span>智能路由</span><span>全球加速</span><span>边缘节点</span><span>跨境网络</span><span>负载均衡</span><span>反向代理</span>
			</div>

			{#if showAds}
			<div class="rd-ad-slot"><Ad type="autorelaxed" /></div>
			{/if}

			<div class="rd-kw-block">
				<span>Shadowsocks</span><span>V2Ray</span><span>Trojan</span><span>WireGuard</span><span>SOCKS5</span><span>HTTP代理</span><span>VPN隧道</span><span>隧道协议</span>
			</div>

			{#if showAds}
			<div class="rd-ad-slot"><Ad type="auto" /></div>
			{/if}

			<div class="rd-kw-block">
				<span>智能DNS</span><span>流量调度</span><span>零信任</span><span>端到端加密</span><span>传输优化</span><span>链路聚合</span><span>边缘计算</span><span>内容分发</span>
			</div>

			<p class="rd-skip">
				<button onclick={() => location.reload()}>{skipText}</button>
			</p>
		</div>
	</div>
</div>

<style>
	:global(body) { margin: 0; overflow-x: hidden; }
	.rd-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
		background: transparent;
	}
	.rd-keywords-bg {
		position: fixed;
		inset: 0;
		display: flex;
		gap: 32px;
		padding: 40px 32px;
		pointer-events: none;
		user-select: none;
		z-index: 0;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
	}
	.rd-kw-col { display: flex; flex-direction: column; gap: 14px; min-width: 140px; flex: 1; max-width: 220px; }
	.rd-kw-col span { color: var(--md-sys-color-primary); font-size: 13px; font-weight: 500; opacity: 0; letter-spacing: 0.5px; white-space: nowrap; text-align: center; }
	.rd-card {
		position: relative; z-index: 1; width: 100%; max-width: 460px;
		background: var(--glass-bg);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		border-radius: 20px; overflow: hidden;
	}
	.rd-card-glow {
		position: absolute; inset: 0;
		background: radial-gradient(ellipse at 50% 0%, var(--md-sys-color-primary-container) 0%, transparent 70%);
		pointer-events: none; opacity: 0.15;
	}
	.rd-card-content { position: relative; padding: 40px 28px 24px; display: flex; flex-direction: column; align-items: center; }
	.rd-spin-icon {
		font-size: 80px; color: var(--md-sys-color-primary);
		animation: spin 0.5s linear infinite;
		margin-bottom: 20px;
	}
	@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
	.rd-countdown {
		font-size: 16px; color: var(--md-sys-color-on-surface-variant); margin: 0 0 20px;
		text-align: center; font-weight: 400; letter-spacing: 0.3px;
	}
	.rd-ad-slot {
		width: 100%; margin: 8px 0;
	}
	.rd-kw-block {
		display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 12px;
		margin: 12px 0; padding: 8px 0; user-select: none;
	}
	.rd-kw-block span {
		font-size: 12px; color: var(--md-sys-color-on-surface-variant);
		opacity: 0; font-weight: 400; letter-spacing: 0.3px;
	}
	.rd-skip { margin: 20px 0 8px; text-align: center; }
	.rd-skip :global(button) {
		display: inline-block; padding: 12px 36px;
		background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
		border: none; border-radius: 999px; font-size: 14px; font-weight: 500;
		cursor: pointer; letter-spacing: 0.3px; transition: all 0.2s ease;
		box-shadow: 0 4px 20px rgba(127,51,0,0.25);
	}
	.rd-skip :global(button:hover) { filter: brightness(1.15); box-shadow: 0 6px 28px rgba(127,51,0,0.35); transform: translateY(-1px); }
</style>
