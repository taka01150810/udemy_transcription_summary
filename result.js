
await page.goto('https://wikipedia.org')

const englishButton = await page.waitForSelector('#js-link-box-en > strong')
await englishButton.click()

const searchBox = await page.waitForSelector('#searchInput')
await searchBox.type('telephone')

await page.keyboard.press('Enter')
await page.close()
