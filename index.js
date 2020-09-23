const { google } = require('googleapis');
const cred = require('./credentials.json');
const syllables = require('syllables');
// const readingTime = require('reading-time');
 
var args = process.argv.slice(2);
function getIdFromUrl(url) { return url.match(/[-\w]{25,}/); }

const client = new google.auth.JWT(
  cred.client_email,
  null,
  cred.private_key,
  ['https://www.googleapis.com/auth/documents.readonly']
);

client.authorize(function(err, tokens){

if(err){
  console.log(err);
  return;
}else{
  console.log('Connected!');
  main(client);
}

});

var docId = getIdFromUrl(String(args));

async function main(cl){
  const docs = google.docs({version: 'v1',auth: cl});
  docs.documents.get({
    documentId: docId,
  }, (err, res) => {
      var doc = res.data;
      var data = doc.body.content;
      
      var wordCount=0;

      // -1 to ignore the empty text element of the document
      var imageCount=-1;
      var sentenceCount =0;
      var syllableCount =0;

      for(var i=0;i<data.length;i++){
        if(data[i].paragraph!=undefined && data[i].paragraph.elements[0].textRun!=undefined){
          sentenceCount+=data[i].paragraph.elements[0].textRun.content.split(".").length-1;
          syllableCount+=syllables(data[i].paragraph.elements[0].textRun.content);
          wordCount+=(data[i].paragraph.elements[0].textRun.content.countWords());     
        }else{
          imageCount+=1;
        }
      }
      console.log("Word Count : " + wordCount);
      console.log("Image Count : " + imageCount);
      console.log("Sentence Count : " + sentenceCount);
      console.log("Syllable Count : " + syllableCount);
      
      console.log("Reading Time : " + readingTime(wordCount, imageCount) + " minutes");
      console.log("Readability Score : " + readability(wordCount, sentenceCount, syllableCount));

  });
}

function readingTime(wordCount, imageCount){
  var averageWordsPerMin = 250;
  var averageImagesPerSec = 5;

  var time = wordCount/ averageWordsPerMin + (averageImagesPerSec / 60.0 * imageCount);
  return Math.round(time);

}

function readability(wordCount, sentenceCount, syllableCount){
  var o = wordCount/sentenceCount;
  var t = syllableCount/wordCount;
  return Math.round(206.835 - (1.015*o) - (84.6*t));
}

String.prototype.countWords = function(){
  return this.split(/\s+/).length;
}

