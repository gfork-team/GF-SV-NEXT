<script lang="ts">
	import { t, type Lang } from '$i18n';
	import Ad from '$components/Ad.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lang: Lang = $derived(data.lang);

</script>

<svelte:head>
<title>{t(lang, 'meta.applist_title')}</title>
	<meta name="description" content={t(lang, 'meta.applist_desc')} />
	<meta name="keywords" content="userscript managers, tampermonkey, greasemonkey, scriptcat, violentmonkey, browser extensions, user script managers" />
</svelte:head>

<div class="width-constraint" style="padding-top:32px;padding-bottom:32px">
	<div style="text-align:center;margin:0 0 24px">
		<Ad type="fluid" />
	</div>

	<section class="text-content">
		<h3>{t(lang, 'applist.desktop_browsers')}</h3>

		<ul>
			<li>
				<strong>Google Chrome</strong>：
				<ul>
					<li><a href="https://docs.scriptcat.org/" target="_blank" rel="noopener">ScriptCat</a></li>
					<li><a href="https://www.tampermonkey.net/index.php?browser=chrome" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>

			<li>
				<strong>Microsoft Edge</strong>：
				<ul>
					<li><a href="https://docs.scriptcat.org/" target="_blank" rel="noopener">ScriptCat</a></li>
					<li><a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>

			<li>
				<strong>Mozilla Firefox</strong>：
				<ul>
					<li><a href="https://docs.scriptcat.org/" target="_blank" rel="noopener">ScriptCat</a></li>
					<li><a href="https://addons.mozilla.org/firefox/addon/greasemonkey/" target="_blank" rel="noopener">Greasemonkey</a></li>
					<li><a href="https://addons.mozilla.org/firefox/addon/tampermonkey/" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://addons.mozilla.org/firefox/addon/violentmonkey/" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>

			<li>
				<strong>Safari</strong>：
				<ul>
					<li><a href="https://www.tampermonkey.net/?browser=safari" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://apps.apple.com/app/userscripts/id1463298887" target="_blank" rel="noopener">Userscripts</a></li>
				</ul>
			</li>

			<li>
				<strong>Opera</strong>：
				<ul>
					<li><a href="https://addons.opera.com/extensions/details/tampermonkey-beta/" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://violentmonkey.github.io/get-it/" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>

			<li>
				<strong>Maxthon</strong>：
				<ul>
					<li><a href="http://extension.maxthon.com/detail/index.php?view_id=1680" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>

			<li>
				<strong>AdGuard</strong>：
				<ul>
					<li><a href="https://adguard.com/" target="_blank" rel="noopener">AdGuard</a></li>
				</ul>
			</li>
		</ul>

		<hr />

		<h3>{t(lang, 'applist.android_browsers')}</h3>

		<ul>
			<li>
				<strong>Firefox for Android</strong>：
				<ul>
					<li><a href="https://addons.mozilla.org/firefox/addon/greasemonkey/" target="_blank" rel="noopener">Greasemonkey</a></li>
					<li><a href="https://addons.mozilla.org/firefox/addon/tampermonkey/" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://addons.mozilla.org/firefox/addon/violentmonkey/" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>
			<li>
				<strong>Microsoft Edge for Android</strong>：
				<ul>
					<li><a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd" target="_blank" rel="noopener">Tampermonkey</a></li>
				</ul>
			</li>
			<li>
				<strong>Dolphin</strong>：
				<ul>
					<li><a href="https://play.google.com/store/apps/details?id=net.tampermonkey.dolphin" target="_blank" rel="noopener">Tampermonkey</a></li>
				</ul>
			</li>
			<li>
				<strong>UC Browser</strong>：
				<ul>
					<li><a href="https://www.tampermonkey.net/?browser=ucweb&amp;ext=dhdg" target="_blank" rel="noopener">Tampermonkey</a></li>
				</ul>
			</li>
			<li>
				<strong>Kiwi Browser</strong>：
				<ul>
					<li><a href="https://chromewebstore.google.com/detail/tampermonkey-legacy/lcmhijbkigalmkeommnijlpobloojgfn" target="_blank" rel="noopener">Tampermonkey Legacy</a></li>
					<li><a href="https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag" target="_blank" rel="noopener">Violentmonkey</a></li>
				</ul>
			</li>
			<li><a href="https://www.xbext.com" target="_blank" rel="noopener">X Browser</a></li>
			<li><a href="https://viayoo.com/" target="_blank" rel="noopener">Via 浏览器</a></li>
			<li>
				<strong>Lemur Browser</strong>：
				<ul>
					<li><a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd" target="_blank" rel="noopener">Tampermonkey</a></li>
				</ul>
			</li>
		</ul>

		<hr />

		<h3>{t(lang, 'applist.ios_browsers')}</h3>

		<ul>
			<li>
				<strong>Safari</strong>：
				<ul>
					<li><a href="https://www.tampermonkey.net/?browser=safari" target="_blank" rel="noopener">Tampermonkey</a></li>
					<li><a href="https://apps.apple.com/app/userscripts/id1463298887" target="_blank" rel="noopener">Userscripts</a></li>
				</ul>
			</li>
			<li><a href="https://gear4.app/" target="_blank" rel="noopener">Gear Browser</a></li>
			<li><a href="https://viayoo.com/" target="_blank" rel="noopener">Via 浏览器</a></li>
		</ul>
	</section>

	<div style="margin-top:24px">
		<Ad type="autorelaxed" />
	</div>
</div>

<style>
	.text-content ul { list-style: disc; padding-left: 2em; line-height: 1.8; }
	.text-content ul ul { list-style: circle; padding-left: 1.5em; }
	.text-content li { margin-bottom: 4px; }
	.text-content hr { border: none; border-top: 1px solid var(--md-sys-color-outline-variant); margin: 24px 0; }
</style>