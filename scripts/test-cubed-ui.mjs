import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch({headless:true})
const page = await browser.newPage({viewport:{width:1200,height:800}})
const errors=[]; const forbidden=[]
page.on('pageerror',e=>errors.push(e.message))
page.on('request',r=>{if (/millida\.(net|host)/.test(r.url())) forbidden.push(r.url())})
await page.addInitScript(()=>{
 let id=0
 window.__TAURI_INTERNALS__={
 metadata:{currentWindow:{label:'main'},currentWebview:{label:'main'}},
 transformCallback:()=>++id,
 invoke:async(cmd,args)=>{
  if(cmd==='session_status') return {millida:false,accounts:{}}
  if(cmd==='ui_prefs'||cmd==='get_profile_groups') return {}
  if(cmd==='list_java_runtimes'||cmd==='java_majors') return []
  if(cmd==='list_profiles'||cmd==='protected_builds'||cmd==='running_games'||cmd==='list_content') return []
  if(cmd==='get_play_stats') return {builds:[],total:0}
  if(cmd==='cubed_microsoft_client_id') return ''
  if(cmd==='ms_device_start') throw 'В настройках Cubed Launcher укажи Client ID приложения Microsoft'
  if(cmd==='cubed_modrinth_search') return {hits:[{title:'Test pack',description:'A test pack',slug:'test-pack',project_id:'test',author:'Test',downloads:100,categories:['fabric'],versions:['1.21.1']}],total_hits:1}
  if(cmd==='plugin:event|listen') return ++id
  return null
 },convertFileSrc:p=>p,
 }
 window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener:()=>{}}
})
try {
await page.goto(process.env.CUBED_UI_URL || 'http://127.0.0.1:5173')
await page.locator('#s-play.on .lobby-mode').waitFor()
await page.locator('#playBtn').waitFor()
await page.locator('#boot').waitFor({state:'detached'})
assert.equal(await page.locator('#playBtn').evaluate(button => {const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true)
assert.equal(await page.locator('.cubed-shell, .cubed-home, .cubed-nav').count(),0)
await page.getByRole('button',{name:'Аккаунты',exact:true}).click()
await page.getByRole('button',{name:'Добавить аккаунт',exact:true}).click()
await page.getByRole('heading',{name:'Аккаунт Microsoft'}).waitFor()
await page.getByRole('button',{name:'Войти через Microsoft',exact:true}).last().click()
await page.getByRole('status').filter({hasText:'Client ID'}).waitFor()
await page.getByRole('button',{name:'Лобби',exact:true}).click()
await page.getByRole('button',{name:'Мои сборки',exact:true}).click()
await page.getByText(/Создай первую сборку|Create your first modpack/).waitFor()
await page.getByRole('button',{name:'Лобби',exact:true}).click()
await page.getByRole('button',{name:'Modrinth',exact:true}).click()
await page.getByText('Test pack',{exact:true}).waitFor()
await page.getByRole('button',{name:'Настройки',exact:true}).click()
await page.locator('#s-settings .s2').waitFor()
await page.getByRole('tab',{name:'Вид',exact:true}).click()
await page.getByRole('button',{name:'Старый',exact:true}).click()
assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('lay-classic')),true)
await page.locator('.sidebar').waitFor()
await page.getByRole('button',{name:'Новый',exact:true}).click()
assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('lay-classic')),false)
await page.getByRole('button',{name:'Тайга на рассвете',exact:true}).click()
assert.equal(await page.evaluate(()=>localStorage.getItem('m-wp')),'taiga')
const swatch=page.locator('#accentSwatches [role="radio"]').nth(1)
await swatch.click()
assert.ok(await page.evaluate(()=>localStorage.getItem('m-accent')))
await page.getByRole('button',{name:'Лобби',exact:true}).click()
await page.locator('#s-play.on .lobby-mode').waitFor()
await page.waitForTimeout(5500)
assert.equal(await page.getByRole('button',{name:/Магазин|Боевой пропуск|Друзья|Хостинг|CurseForge/}).count(),0)
assert.deepEqual(forbidden,[])
assert.deepEqual(errors,[])
if(process.env.CUBED_SCREENSHOT) await page.screenshot({path:process.env.CUBED_SCREENSHOT})
console.log('UI smoke passed: upstream lobby/shell/settings, Microsoft entry, Modrinth, backgrounds/colors; no Millida requests')
} catch(e) { console.error('Page errors:',errors); console.error((await page.locator('body').innerText()).slice(-2000)); throw e }
finally {await browser.close()}
