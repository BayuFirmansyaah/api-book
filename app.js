const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const puppeteer = require('puppeteer')
const app = express()


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','Get,Post,Put,Delete')
    res.setHeader('Allow-Control-Allow-Headers','Content-Type,Authorization')
    next();
})


// mendapatkan semua jumlah buku
app.route('/books').get((req,res)=>{
    let data = fs.readFileSync('./db.json','utf-8')
        data = JSON.parse(data);
        data = data.Books;

    send(res,data,200,'json')
})

// mendapatkan jumlah buku dengan jumlah
app.route('/books/:jumlah').get((req,res) => {
    let data = fs.readFileSync('./db.json', 'utf-8')
    data = JSON.parse(data);
    let jumlah = parseInt(req.params.jumlah);
    let book = data.Books;
    let dummyData = []

    for (let i = 0; i < jumlah; i++) {
        dummyData.push(book[i]);
    }

    send(res,dummyData,200,'json');

})

// mendapatkan jumlah buku dengan jumlah dan terbaru
app.route('/books/last/:jumlah').get((req, res) => {
    let data = fs.readFileSync('./db.json', 'utf-8')
    data = JSON.parse(data);
    let jumlah = parseInt(req.params.jumlah);
    let book = data.Books;
    let dummyData = []
    let start = book.length - jumlah;
    jumlah += start;

    for (let i = start; i < jumlah; i++) {
        dummyData.push(book[i]);
    }

    send(res, dummyData, 200, 'json');
})


app.route('/books/details/:id').get((req,res)=>{
    let data = fs.readFileSync('./db.json', 'utf-8')
    data = JSON.parse(data);
    let id = req.params.id;
        id = parseInt(id)
    let book = data.Books;
    let dummyData = [];

    for(let i=0;i<book.length;i++){
        if(book[i].id === id) dummyData.push(book[i])
    }

    if(dummyData.length <1){
        send(res,'Book Cannot Find',200,'json');
    }else{  
        send(res, dummyData, 200, 'json');
    }
})



// crawl data
app.route('/crawl').get(async(req,res)=>{
    console.log('run')
    let browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://wattpad/com", []);
    let page = await browser.newPage();
    await page.setDefaultNavigationTimeout(100000);
    await page.setViewport({ width: 0, height: 0 });
    let result = [];
    let count = 22;

    let kategori = ['fiksiremaja','sma','acak','sekolah','humor','romantis','baper','badboy','cinta']

    for(let i=0;i<kategori.length;i++){
        
        await page.goto("https://wattpad.com/stories/"+kategori[i], {
            waitUntil: "networkidle2",
        });

        autoScroll(page);

        let crawl = await page.evaluate(()=>{
            let data = [];
            let thumbnail = document.querySelectorAll('.browse-story-item')
            let title = null;
            let img = null;
            let writter = null;
            let desc = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.\nIt is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."

            for(let j=0;j<thumbnail.length;j++){
                title = thumbnail[j].querySelector('.title').innerText;
                img = thumbnail[j].querySelector('img').getAttribute('src');
                writter = thumbnail[j].querySelector('.username').innerText;
                writter = writter.replace("by ","")

                // push data ke array
                data.push({ title, img, desc, writter, id: null })
            }

            return data;
        })

        for(let j=0;j<crawl.length;j++){
            crawl[j].id = count;
            count+=1;
            console.log(crawl[j].title);
            result.push(crawl[j]);
        }

        fs.writeFileSync('./scrap.json',JSON.stringify(result,null,2));
        res.end();
    }

})




const send = (res,data,status,type='text') => {
    const result = {
            Status : status,
            Results : data
    }

    if(type === "json"){
        res.json(result);
    }else{
        res.send(data);
    }

    res.end();
}



async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 1000;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}





app.listen(8000, () => {
    console.log(`Server started on port http://locahost:8000`);
});