<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);
</script>

<svelte:head>
<title>{t(lang, 'meta.installing_title')}</title>
	<meta name="description" content={t(lang, 'meta.installing_desc')} />
	<meta name="keywords" content="userscript installation guide, script manager install, tampermonkey installation, greasemonkey installation, user script setup" />
</svelte:head>

<div class="width-constraint" style="padding-top:32px;padding-bottom:32px">
	<div class="text-content" style="margin-bottom:16px">
		<Ad type="fluid" />
	</div>

	<section class="text-content">
		<h2 class="headline-small" style="text-align:center;margin-bottom:20px">{t(lang, 'installing.title_page')}</h2>

		<h3>{t(lang, 'installing.what_is')}</h3>
		<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.8">
			用户脚本注定不是平凡的工具脚本，若春日影，又宛如禁忌乐章——改写网页、删除烦人元素，像即兴演奏一样自由，又像命运剧本般精准。安装 Greasy Fork 的这些由全球用户谱写的免费脚本，点下确认的瞬间，你的浏览体验就会被轻易地彻底重构。
		</p>
		<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.8">
			简单来说，在浏览器页面注入用户脚本是引入第三方针对特定网站优化增强功能的手段之一。显然，这有可能会带来诸如个人账号被窃取、网页停用有关功能等风险。
		</p>
		<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.8">
			本加速工具站承诺此加速服务仅对脚本代码中的源站脚本更新API地址进行修改。请一定谨慎选择脚本进行安装，部分恶意的脚本可能对您的数据进行非法操作，本站对脚本安全的可靠性无法负责。
		</p>

		<h3>{t(lang, 'installing.steps_title')}</h3>

		<h4>{t(lang, 'installing.step1_title')}</h4>
		<p style="color:var(--md-sys-color-on-surface-variant)">
			<a href="/{lang}/applist">{t(lang, 'nav.applist')}</a>
		</p>

		<h4>{t(lang, 'installing.step2_title')}</h4>
		<ol style="color:var(--md-sys-color-on-surface-variant);line-height:1.8;padding-left:2em">
			<li>打开本站：<a href="/{lang}">{t(lang, 'site.name')}</a>（本站 GFork Proxy 提供 Greasy Fork 加速服务，使用本站即默认您阅读并同意了<a href="/{lang}/tos">用户协议</a>）</li>
			<li>在搜索框中输入你想安装的脚本名称或功能关键词</li>
			<li>从搜索结果中选择合适的脚本（此时可以直接点击「安装」按钮以安装，但不建议，因为装脚本前最好先看看评论区）</li>
			<li>进入脚本详情页面后，仔细查阅，然后点击绿色的「安装此脚本」按钮</li>
			<li>浏览器上已安装的用户脚本管理器将会弹出安装确认窗口，点击「安装」按钮</li>
		</ol>

		<h4>{t(lang, 'installing.step3_title')}</h4>
		<ol style="color:var(--md-sys-color-on-surface-variant);line-height:1.8;padding-left:2em">
			<li>安装完成后，访问脚本适用的网站</li>
			<li>脚本会自动运行（部分脚本可能需要刷新页面）</li>
			<li>有些脚本会在页面上添加控制按钮或菜单，你可以通过这些界面调整脚本功能</li>
		</ol>

		<!-- AD: Mid content -->
		<div style="text-align:center;margin:24px 0">
			<Ad type="horizontal" />
		</div>

		<h3>{t(lang, 'installing.notes_title')}</h3>
		<ol style="color:var(--md-sys-color-on-surface-variant);line-height:1.8;padding-left:2em">
			<li>尽量从可信来源安装脚本</li>
			<li>安装前一定要阅读脚本描述和评论区，以了解脚本功能和安全问题状态</li>
			<li>定期更新脚本，以获得最新功能和问题修复</li>
			<li>如果脚本导致网页异常，请通过浏览器上的脚本管理界面暂时禁用或删除该脚本</li>
		</ol>

		<h3>{t(lang, 'installing.qa_title')}</h3>

		<h4>{t(lang, 'installing.qa_manage')}</h4>
		<ol style="color:var(--md-sys-color-on-surface-variant);line-height:1.8;padding-left:2em">
			<li>点击浏览器右上角的<a href="/{lang}/applist">用户脚本管理器</a>（油猴插件）图标</li>
			<li>选择「仪表盘」</li>
			<li>进入「已安装脚本」标签页中，你可以：
				<ul>
					<li>启用/禁用脚本</li>
					<li>编辑脚本代码</li>
					<li>检查更新</li>
					<li>删除脚本</li>
				</ul>
			</li>
		</ol>

		<h4>{t(lang, 'installing.qa_download')}</h4>
		<ol style="color:var(--md-sys-color-on-surface-variant);line-height:1.8;padding-left:2em">
			<li>如果你是使用手机端浏览器，请确保浏览器支持油猴脚本，如果是Via浏览器，可能是因为有延迟，耐心等待30秒</li>
			<li>如果电脑浏览器，请确保你的用户脚本管理器工作正常，如果篡改猴工作不正常，可以改为使用脚本猫</li>
		</ol>

		<h4>{t(lang, 'installing.qa_baidu')}</h4>
		<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.8">
			当前浏览器触发了本站安全防护机制，请刷新网站或更换浏览器
		</p>

		<h4>{t(lang, 'installing.qa_win7')}</h4>
		<p style="color:var(--md-sys-color-on-surface-variant);line-height:1.8">
			请使用"暴力猴"这款用户脚本管理器
		</p>
	</section>

	<div class="text-content" style="margin-top:24px">
		<Ad type="auto" />
	</div>
</div>