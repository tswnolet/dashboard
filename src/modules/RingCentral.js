const RingCentral = require('@ringcentral/sdk').SDK;
require('dotenv').config();

const rc = new RingCentral({
    server: "https://platform.ringcentral.com",
    clientId: "9awpKMaTzypb6mMR0pgLxM",
    clientSecret: "fkEAqw5MVAJeOx3Ke81UaO7LqoTYkVA92f827N9CHZyh"
});

async function login() {
    try {
        await rc.platform().login({ jwt: "eyJraWQiOiI4NzYyZjU5OGQwNTk0NGRiODZiZjVjYTk3ODA0NzYwOCIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJhdWQiOiJodHRwczovL3BsYXRmb3JtLnJpbmdjZW50cmFsLmNvbS9yZXN0YXBpL29hdXRoL3Rva2VuIiwic3ViIjoiMzk1NDA3MjAzNiIsImlzcyI6Imh0dHBzOi8vcGxhdGZvcm0ucmluZ2NlbnRyYWwuY29tIiwiZXhwIjozODc5MDE2NTkyLCJpYXQiOjE3MzE1MzI5NDUsImp0aSI6Ik1WREpiY2JQUmhPS0tkLWpOOVUwY0EifQ.DMsN4yxzL22_eLjt96A5IirCPM8jGifcSIuF1bkrWZTVdUpdd-ofFm-4SmxtV2y79q3YCNh9SwwfWVxPjlibk1ZQSUmhyPvzoQA32onLK8P3nkYkyQpN0dajuFgHYm2piKDfmEtufsFhXy010BvPnSb8w-ij4u-Ku5e2nsMKRHT1hQtbj2WWtzHnjbC8OJ2iHqwu6JzjiDzY0phZCb69vePvRbTVOeXFCdmcMxChzxbO9nM2K-6DviDR5mOJb3Dcifsl1EGl9wNZcb7NO23OL5upJ6K0YdC0dnKYwi7zX7GBR5RNNBUHpbIV4LqOdlMpgzb4zvKfSaduk2cH8oNNBQ" });
        console.log("✅ Successfully authenticated via JWT");
        
        const r = await rc.platform().get("/restapi/v1.0/account/~/extension/~");
        console.log(await r.json());
    } catch (error) {
        console.error("❌ Authentication Failed:", error);
    }
}

login();