import GoogleVoice from './GoogleVoice';

(async () => {
    let client = new GoogleVoice();
    let res = await client.getMessageByPhoneNumber("40404").catch(function (error) {
        console.log(error);
    })
    console.log(res)
})()
// new Request(key).getVoice('915f09d527a00550fbac5ab07bd024baa4255f4e').then((response) => {
//     fs.writeFileSync('test.mp3', response);
// }).catch(function (error) {
//     console.log(error);
// })