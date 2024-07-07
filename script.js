import {remote} from "webdriverio";
import {expect} from "chai";
import * as fs from "fs";
import tf from '@tensorflow/tfjs-node'
import {exec} from 'child_process'
import mobilenet from '@tensorflow-models/mobilenet'

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
  await toggleWifi(true)
  await launchAppAndGetResponse('no_wifi')
  await toggleWifi(false)
  await launchAppAndGetResponse('wifi')
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

async function analyzeScreenshot(filePath) {
  const image = fs.readFileSync(filePath);
  const decodedImage = tf.node.decodeImage(image, 3);
  const model = await mobilenet.load();
  const predictions = await model.classify(decodedImage);

  return predictions;
}

async function launchAppAndGetResponse(filename = 'result', appActivity = 'com.google.android.finsky.activities.MainActivity', appPackage = 'com.android.vending') {
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

  await driver.pause(2000);
  try {
    const screenshotPathNoInternet = `${filename}.png`;
    await driver.saveScreenshot(screenshotPathNoInternet);

    const predictionsNoInternet = await analyzeScreenshot(screenshotPathNoInternet);
    console.log('Predictions without internet:', predictionsNoInternet);


    exec(`adb logcat -d > ${filename}.txt`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error capturing logs: ${error}`);
      }
    });

    // Expected condition
    // const onlineMessage = await driver.$('selector_for_online_message');
    // expect(await onlineMessage.isDisplayed()).to.be.true;

  } catch (error) {
    console.log(error)
  } finally {
    await driver.deleteSession();
  }
}

runTest().catch(console.error);