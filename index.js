const jimp = require("jimp");
const PNG = require("pngjs").PNG;

let pixelmatch;

async function loadPixelmatch() {
  try {
    pixelmatchModule = await import("pixelmatch");
    pixelmatch = pixelmatchModule.default;
  } catch (error) {
    console.error("Failed to load pixelmatch:", error);
    process.exit(1);
  }
}

const urlToBuffer = async (url) => {
  return new Promise((resolve, reject) => {
    jimp.read(url, (err, image) => {
      if (err) {
        console.log(`error reading image in jimp: ${err}`);
        reject(err);
      }
      image.resize(400, 400);
      image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
        if (err) {
          console.log(`error converting image url to buffer: ${err}`);
          reject(err);
        }
        resolve(buffer);
      });
    });
  });
};

const compareImage = async (twitterProfilePicURL, assetCDNURL) => {
  try {
    console.log("> Started comparing two images");
    const img1Buffer = await urlToBuffer(twitterProfilePicURL);
    const img2Buffer = await urlToBuffer(assetCDNURL);
    const img1 = PNG.sync.read(img1Buffer);
    const img2 = PNG.sync.read(img2Buffer);
    const { width, height } = img1;
    const diff = new PNG({ width, height });

    const difference = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
      }
    );

    const compatibility = 100 - (difference * 100) / (width * height);
    console.log(`${difference} pixels differences`);

    if (compatibility >= 90) {
      console.log("Images are very similar.");
    } else if (compatibility >= 70) {
      console.log("Images are somewhat similar.");
    } else {
      console.log("Images are significantly different.");
    }

    console.log(`Compatibility: ${compatibility.toFixed(2)}%`);
    console.log("< Completed comparing two images");
    return compatibility;
  } catch (error) {
    console.log(`error comparing images: ${error}`);
    throw error;
  }
};

loadPixelmatch().then(() => {
  compareImage("./img/kik.png", "./img/askfm.png");
});
