var request = require("/opt/node_modules/request");
var rp = require('/opt/node_modules/request-promise');
// rp('https://api.uspharmacycard.com/drug/price/147/none/08873/00378395277/Atorvastatin%20Calcium/GENERIC/30/8')
//     .then(function (response) {
//         console.log("test:"+response)
//         // Process html...
//     })
//     .catch(function (err) {
//         // Crawling failed...
//     });
//single care
const {Pool, Client} = require('/opt/node_modules/pg');
var db_host = process.env.DB_HOST;
var reg = process.env.REGION;


// const connectionString = 'postgresql://postgres:secret@10.80.1.121:5432/apid'
const connectionString = db_host;
function DateFunction(){
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    return dateTime;
}
var DrugId=""
const client=new Client({
    connectionString:connectionString
})
client.connect()
var listDrugs = [];
let pricingData1 = {
    //id : "",
    average_price : 0,
    createdat : DateFunction(),
    difference : 0,
    drug_details_id : 0,
    lowest_market_price : 0,
    pharmacy : "",
    price : 0,
    program_id : 4,
    recommended_price : 0,
}

//let results =""
let url = ""
let data = []
var len=0;
exports.myhandler = async function abc(){
// testing for program is active or not
//         client.query('select isActive from programmaster where id = "singlecare"', (error, results) => {
//             if (error) {
//                 throw error
//             }
//             //response.status(200).json(results.rows)
//             //res = results.rows[0].isactive;
//             // let status=res.isactive;
//if(status){
    var res1 = await client.query("SELECT drug_id FROM shuffle_drugs where flag = 'pending' and region = '"+reg+"'");
    for(var i=0; i< res1.rows.length ; i++){
        for(var j=0; j < res1.rows[i].drug_id.length; j++){
            //console.log("print ((((((((((((((((((("+res1.rows[i].drug_id[j]);
            listDrugs.push(res1.rows[i].drug_id[j]);
            //console.log("listdrugs:"+listDrugs)
        }
    }
    len = listDrugs.length;
    console.log(len)
    console.log(listDrugs)
   // const a = len;
    for(let k=0; k < len; k++){
        //console.log("listdrugs2:"+k)
        //if(k<=len){

        var drugUrlList = await client.query("SELECT * FROM drug_request where program_id = 4 and drug_id :: int ="+listDrugs[k]);
         if(drugUrlList.rows != 0){
        url = "https://webapi.singlecare.com/api/pbm/tiered-pricing/"+drugUrlList.rows[0].ndc+"?qty="+drugUrlList.rows[0].quantity+"&zipCode="+drugUrlList.rows[0].zipcode;

        await rp(url)
            .then(async function (response) {
                //console.log(url)
                let jsondata = JSON.parse(response);
                pricingData1.price = jsondata.Result.PharmacyPricings[0].Prices[0].Price;
                pricingData1.pharmacy = jsondata.Result.PharmacyPricings[0].Pharmacy.Name;
                //console.log("price="+pricingData1.price);
                const query2 = 'INSERT INTO public_price(average_price, createdat, difference, drug_details_id, lowest_market_price, pharmacy, price, program_id, recommended_price) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *';
                const values = [pricingData1.average_price, pricingData1.createdat, pricingData1.difference, drugUrlList.rows[0].drug_id, pricingData1.lowest_market_price,pricingData1.pharmacy,pricingData1.price,pricingData1.program_id,pricingData1.recommended_price];
                await client.query(query2, values)
                    .then(res => {
                    })
                    .catch(e => {console.log("errr")})
                // Process html...

            })
            .catch(function (err) {
                console.log(err)
                // Crawling failed...
                
            });
         }else{continue}

        // request.get(url, (error, response, body) => {
        //     let jsondata = JSON.parse(body);
        //     pricingData1.price = jsondata.Result.PharmacyPricings[0].Prices[0].Price;
        //     pricingData1.pharmacy = jsondata.Result.PharmacyPricings[0].Pharmacy.Name; // =============>> name for price table
        // })

        //   }else{console.log("all records fetched")}
    }
}
//exports.myhandler();