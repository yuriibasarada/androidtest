const {remote} = require("webdriverio");


const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android',
  'appium:appPackage': 'com.android.settings',
  'appium:appActivity': 'com.android.settings.Settings',
};
const wdOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'info',
  capabilities
};



async function runTest() {
  await toggleWifi()
  await launchAppAndGetResponse()
  await toggleWifi(true)
  await launchAppAndGetResponse()
}

async function toggleWifi(val = false) {

  const driver = await remote(wdOpts);

  try {
    await driver.pause(1000);
    const wifiItem = await driver.$('//android.widget.TextView[@text="Connections"]');
    await wifiItem.click();

    await driver.pause(1000);

    const wifiSwitch = await driver.$('//android.widget.Switch');
    const wifiSwitchStatus = await wifiSwitch.getAttribute('checked');


    if(val !== (wifiSwitchStatus === 'true')) {
      await wifiSwitch.click()
    }


  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await driver.deleteSession();
  }
}


async function launchAppAndGetResponse(appActivity = 'com.google.android.finsky.activities.MainActivity', appPackage = 'com.android.vending') {
  const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android',
    'appium:appPackage': appPackage,
    'appium:appActivity': appActivity,
  };

  const driver = await remote({
    ...wdOpts,
    capabilities
  });

  await driver.pause(1000);

  try {
    const pageSource = await driver.getPageSource();
    console.log(pageSource)
  } catch (error) {
    console.log(error)
  } finally {
    await driver.deleteSession();
  }

}

runTest().catch(console.error);