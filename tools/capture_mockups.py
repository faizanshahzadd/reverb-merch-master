import asyncio,sys,base64
from playwright.async_api import async_playwright
SP=sys.argv[1]
WANT=['Mug','T-Shirt','Hoodie','Tote','Cap','Gift Box','Diary','Sports Bottle','Paper Bag','Keychain','Button Badge','Notebook']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome');pg=await b.new_page(viewport={'width':1400,'height':1000})
    await pg.goto('http://localhost:8765/index.html#mockup');await pg.wait_for_timeout(2000)
    for name in WANT:
      await pg.evaluate("n=>[...document.querySelectorAll('#prodPick .prod-btn')].find(b=>b.title===n).click()",name)
      await pg.wait_for_timeout(400)
      await pg.evaluate("()=>{const h=document.getElementById('mkpHint');h.style.display='none'}")
      d=await pg.evaluate("()=>document.getElementById('mkpCanvas').toDataURL('image/png')")
      open(f"{SP}/vid/mk/{name.replace(' ','_')}.png",'wb').write(base64.b64decode(d.split(',')[1]))
    await b.close()
asyncio.run(main())
