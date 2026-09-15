'use strict';
const main = document.querySelector('#main');
const sidebar = document.querySelector('#sidebar');
let data;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateText = value => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value.replace(/-/g, '.');
  if (/^\d{4}-\d{2}-\d{2}T/.test(value || '') && !Number.isNaN(Date.parse(value))) return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(/\//g,'.')+' 北京时间';
  return value || '日期详见原文';
};
const text = value => Array.isArray(value) ? value.join('；') : (value || '');
const domainName = id => data.domains.find(d=>d.id===id)?.name || text(id);
const safeUrl = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } };
const externalLink = (source, className = '') => { const url = safeUrl(source.url); return url ? `<a class="${className}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.name || source.title || new URL(url).hostname)} <span aria-hidden="true">↗</span></a>` : `<span>${esc(source.name || '')}</span>`; };
const head = (eyebrow, title, subtitle, issue = '') => `<div class="page-heading"><div class="heading-copy"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="subline">${esc(subtitle)}</p><span class="heading-ornament" aria-hidden="true">✧</span></div>${issue ? `<div class="issue-number">${esc(issue)}<small>RESEARCH NOTES</small></div>` : ''}</div>`;
function navigation(active, date) {
  main.setAttribute('data-section', active);
  main.setAttribute('data-layout', 'reader');
  document.querySelectorAll('[data-nav]').forEach(a => { const selected = a.dataset.nav === active; a.classList.toggle('active', selected); selected ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'); });
  const links = data.digests.map((d,i) => `<a class="archive-link ${d.date === date ? 'active' : ''}" href="#daily/${d.date}" ${d.date === date ? 'aria-current="page"' : ''}>${esc(dateText(d.date))}<small>${i === 0 ? '最近归档 · ' : ''}${d.kind === 'backfill' ? '补查日报' : '研究资讯日报'}</small></a>`).join('');
  sidebar.innerHTML = `<p class="eyebrow">阅读归档 / ${data.digests.length}</p><div class="archive-list">${links}</div><figure class="sidebar-art"><img src="assets/hollow-knight.webp" alt="小骑士站在泪水之城的屋檐下，望着雨中的灯火" width="480" height="720" loading="lazy" decoding="async"><figcaption><span>檐下听雨</span><small>在微光中，继续探索。</small></figcaption></figure><div class="sidebar-note"><strong>每天 09:00 · 北京时间</strong>计划收集后同步阅读站。最新归档以实际日期为准。</div><div class="sidebar-note"><strong>研究资料</strong><div class="side-links"><a href="#document/open-source-learning">开源学习项目 ↗</a><a href="#document/advanced-repos">进阶研究实现 ↗</a><a href="#document/source-radar">来源核验方法 ↗</a></div></div>`;
}
function renderDaily(date, domain = '') {
  const digest = date ? data.digests.find(d => d.date === date) : data.digests[0];
  if (!digest) return renderMissing('未找到这期日报');
  navigation('daily', digest.date);
  main.setAttribute('data-layout', 'overview');
  document.title = `${digest.date} · AGI 研究手记`;
  const domains = [...new Set(digest.items.map(item => text(item.domain)).filter(Boolean))];
  const filtered = domain ? digest.items.filter(item => text(item.domain) === domain) : digest.items;
  const issue = String(data.digests.length - data.digests.indexOf(digest)).padStart(2,'0');
  main.innerHTML = head(`每日简报 / ${dateText(digest.date)}`, '本期研究，值得继续追问', `${digest.items.length} 条研究线索 · 约 ${digest.readMinutes} 分钟 · ${digest.kind === 'backfill' ? '补查日报' : '研究资讯日报'}`, issue) +
    `<div class="coverage-note">${esc(text(digest.intro))}<details class="coverage-details"><summary>查看本次覆盖情况</summary><p>${esc(text(digest.coverageNote))}</p></details></div><div class="reading-actions"><span class="subline">${domain ? `${esc(domainName(domain))} · ${filtered.length} 条` : '保留原始来源、研究条件与局限'}</span><a class="text-link" href="#report/${digest.date}">阅读完整日报 ↗</a></div><div class="filter-row" aria-label="按研究领域浏览"><a class="filter ${!domain?'active':''}" href="#daily/${digest.date}" ${!domain?'aria-current="true"':''}>全部</a>${domains.map(d => `<a class="filter ${domain===d?'active':''}" href="#daily/${digest.date}?domain=${encodeURIComponent(d)}" ${domain===d?'aria-current="true"':''}>${esc(domainName(d))}</a>`).join('')}</div>` +
    `<div class="article-list">${filtered.length ? filtered.map(item => story(item, digest, digest.items.indexOf(item)+1)).join('') : '<div class="empty">本期没有这个领域的条目。<br><a class="text-link" href="#daily/'+digest.date+'">查看全部内容</a></div>'}</div>`;
}
function story(item, digest, index) {
  const path = `#item/${digest.date}/${encodeURIComponent(item.id)}`;
  return `<article class="story"><span class="story-number" aria-hidden="true">${String(index).padStart(2,'0')}</span><div><div class="story-meta"><span class="tag">${esc(domainName(item.domain))}</span><span>${esc(dateText(item.publicationDate))}</span>${item.type?`<span>${esc(item.type)}</span>`:''}</div><h2><a href="${path}">${esc(item.title)}</a></h2><p class="story-summary">${esc(text(item.summary))}</p><div class="story-bottom"><div class="source-links">${(item.sources||[]).slice(0,3).map(s => externalLink(s)).join('')}</div><a class="read-link" href="${path}">证据与局限 <span aria-hidden="true">→</span></a></div></div></article>`;
}
function renderItem(date, id) {
  const digest = data.digests.find(d => d.date === date);
  const item = digest?.items.find(i => i.id === id);
  if (!item) return renderMissing('未找到这条研究记录');
  navigation('daily', date);
  document.title = `${item.title} · AGI 研究手记`;
  main.innerHTML = `<a class="back-link" href="#daily/${date}">← 返回 ${dateText(date)} 简报</a>` + head(domainName(item.domain),item.title,`${dateText(item.publicationDate)}${item.type ? ' · '+item.type : ''}`) + `<div class="reader item-reader"><p class="lead">${esc(text(item.summary))}</p>${item.dateNote?`<div class="coverage-note">${esc(text(item.dateNote))}</div>`:''}${item.significance?`<section><h2>为什么值得研究</h2><p>${esc(text(item.significance))}</p></section>`:''}<section class="evidence-box"><h2>证据与局限</h2><p>${esc(text(item.limitations) || '请结合原文中的评测条件和研究范围理解，尚无新增独立复现结论。')}</p></section><section><h2>回到原始来源</h2><div class="source-list">${(item.sources||[]).map(s=>externalLink(s,'source-button')).join('')}</div></section><div class="reader-end"><a class="text-link" href="#report/${date}">阅读本期完整日报，包括覆盖情况 ↗</a></div></div>`;
}
function renderReader(record, kind, section) {
  if (!record) return renderMissing('未找到这份资料');
  const daily = kind === 'report';
  navigation(daily ? 'daily' : record.id === 'learning-plan' ? 'learning' : record.id === 'source-radar' ? 'sources' : 'map', daily ? record.date : null);
  const title = daily ? `AGI 研究资讯日报 · ${record.date}` : record.title;
  document.title = `${title} · AGI 研究手记`;
  const root = daily ? `#report/${record.date}` : `#document/${record.id}`;
  main.innerHTML = `<a class="back-link" href="${daily ? '#daily/'+record.date : record.id === 'source-radar' ? '#sources' : '#map'}">← ${daily?'返回本期简报':'返回资料概览'}</a>` + head(daily?'完整日报':'研究资料',title,`约 ${record.readMinutes} 分钟${!daily?' · 资料核查于 '+dateText(record.reviewedAt):''}`) + `<div class="reader-toolbar"><details class="contents-menu"><summary>本文目录 <span aria-hidden="true">⌄</span></summary><nav aria-label="本文目录">${record.toc.map(t=>`<a class="toc-level-${t.level}" href="${root}/${t.id}">${esc(t.title)}</a>`).join('')}</nav></details><label class="font-control">字号 <button type="button" id="font-minus" aria-label="缩小正文字号">A−</button><button type="button" id="font-plus" aria-label="放大正文字号">A＋</button></label></div><article class="reader" id="reader">${record.html}</article><div class="reader-end"><a class="text-link" href="${root}">回到文章开头 ↑</a></div>`;
  let size = 18;
  try { size = Math.min(24,Math.max(16,Number(localStorage.getItem('agi-reading-size'))||18)); } catch {}
  const update = () => { document.querySelector('#reader').style.fontSize=size+'px';document.querySelector('#font-minus').disabled=size<=16;document.querySelector('#font-plus').disabled=size>=24; try { localStorage.setItem('agi-reading-size',String(size)); } catch {} };
  document.querySelector('#font-minus').addEventListener('click',()=>{size=Math.max(16,size-1);update();});
  document.querySelector('#font-plus').addEventListener('click',()=>{size=Math.min(24,size+1);update();});update();
  if(section) requestAnimationFrame(()=>document.getElementById(section)?.scrollIntoView({block:'start'}));
}
function renderMap() {
  navigation('map');document.title='AGI 研究地图 · AGI 研究手记';
  main.setAttribute('data-layout', 'overview');
  main.innerHTML = head(`研究地图 / ${data.domains.length} 个领域`,'把进展，放回研究问题里','资料基线：2026.09.05 · 每日新增进展请查看简报') + `<p class="page-intro">从已有能力出发，关注新任务学习、长期可靠性与开放世界迁移的差距。能力广度、自主程度和评测成绩需要分开理解。</p><div class="reading-actions"><span class="subline">现状 · 差距 · 可验证的问题</span><a class="text-link" href="#document/agi-landscape">阅读完整地图与证据 ↗</a></div><div class="domain-grid">${data.domains.map((d,i)=>`<article class="domain-card"><span class="domain-number">${String(i+1).padStart(2,'0')}</span><h2>${esc(d.name)}</h2><p>${esc(text(d.summary))}</p><div class="gap"><strong>关键差距</strong>${esc(text(d.gap))}</div></article>`).join('')}</div><div class="reading-actions"><a class="text-link" href="#document/open-source-learning">开源学习项目 ↗</a><a class="text-link" href="#document/advanced-repos">进阶研究实现 ↗</a></div>`;
}
function renderSources(type = '') {
  navigation('sources');document.title='来源目录 · AGI 研究手记';
  main.setAttribute('data-layout', 'overview');
  const sources = data.sources || [];
  const types = [...new Set(sources.map(s=>text(s.type)).filter(Boolean))];
  const filtered = type ? sources.filter(s=>text(s.type)===type) : sources;
  main.innerHTML = head('来源目录','先看原始材料，再看观点',`${sources.length} 个核心入口 · 目录核查于 2026.09.05`) + `<p class="page-intro">机构公告发现发布，论文与代码解释方法，独立评测检查边界。研究者动态作为线索，结论回到可核查的材料。</p><div class="reading-actions"><span class="subline">目录不代表每个来源都已成功检查至今日</span><a class="text-link" href="#document/source-radar">查看核验方法与完整清单 ↗</a></div><div class="filter-row" aria-label="按来源类型浏览"><a class="filter ${!type?'active':''}" href="#sources">全部</a>${types.map(t=>`<a class="filter ${type===t?'active':''}" href="#sources?type=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div><div class="source-grid">${filtered.map(s=>`<article class="source-card"><span class="tag">${esc(text(s.type))}</span><h2>${externalLink(s)}</h2><p>${esc(text(s.description))}</p></article>`).join('')}</div>`;
}
function renderMissing(message) { navigation('daily'); main.innerHTML=`<div class="empty"><h1>${esc(message)}</h1><p>可以从已有归档继续阅读。</p><a class="text-link" href="#daily">返回最新简报</a></div>`; }
function route() {
  if(!data)return;
  const fragment=location.hash.slice(1)||'daily';
  const [path,query] = fragment.split('?');
  let parts;try{parts=path.split('/').map(decodeURIComponent);}catch{return renderMissing('阅读链接格式不正确');}
  const [view,id,section] = parts;const params = new URLSearchParams(query || '');
  window.scrollTo({top:0,behavior:'instant'});
  if(view==='daily')renderDaily(id,params.get('domain')||'');
  else if(view==='item')renderItem(id,section);
  else if(view==='report')renderReader(data.digests.find(d=>d.date===id),'report',section);
  else if(view==='map')renderMap();
  else if(view==='learning')renderReader(data.documents.find(d=>d.id==='learning-plan'),'document');
  else if(view==='sources')renderSources(params.get('type')||'');
  else if(view==='document')renderReader(data.documents.find(d=>d.id===id),'document',section);
  else renderMissing('未找到这个阅读页面');
}
async function boot(){
  try{
    const response=await fetch('data.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('content unavailable');
    data=await response.json();
    if(!Array.isArray(data.digests)||!Array.isArray(data.documents))throw new Error('invalid content');
    route();
  }catch(error){main.innerHTML='<div class="empty"><h1>暂时没有载入成功</h1><p>阅读资料没有丢失，请稍后重试。</p><button class="filter" id="retry">重新载入</button></div>';document.querySelector('#retry').addEventListener('click',boot);}
}
window.addEventListener('hashchange',route);
boot();
