//@ts-check

//Dependancies
const express = require('express');
const path = require('path');
const items = require('./items.json');
const utils = require('./utils.js');

//Express
const app = express();
app.set('views', path.join(__dirname, '../', 'views'));
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, '../', 'public')));
app.use(express.urlencoded({extended: true}));
app.listen(8080);

//Data
const bags = new Map();

//Paths
app.get("/", (req,res)=>{
    const cookies = utils.reqCookies(req);
    if(cookies['bagID']){
        if (bags.has(cookies['bagID'])){
            const bag = bags.get(cookies['bagID']);
            res.render("index", {
                items, bag
            });
        }else{
            res.clearCookie('bagID');
            res.redirect("/");
        }
    }else{
        const newBag = [];
        let newBagID = utils.idGenerator();
        bags.set(newBagID, newBag);
        res.cookie('bagID', newBagID, {maxAge: ((new Date().getTime()) + 1000 * 60 * 60 * 2)});
        res.render("index", {
            items, bag: newBag            
        });
    }
});

app.get("/bag", (req, res) => {
    const cookies = utils.reqCookies(req);
    if (cookies['bagID']) {
        if (bags.has(cookies['bagID'])) {
            const bag = bags.get(cookies['bagID']);
            res.render("bag", {
                items, bag
            });
        } else {
            res.clearCookie('bagID');
            res.redirect("/bag");
        }
    } else {
        const newBag = [];
        let newBagID = utils.idGenerator();
        bags.set(newBagID, newBag);
        res.cookie('bagID', newBagID, { maxAge: ((new Date().getTime()) + 1000 * 60 * 60 * 2) });
        res.render("bag", {
            items, bag: newBag
        });
    }
});

app.post('/addToCart', (req,res) =>{
    const cookies = utils.reqCookies(req);
    if(req.body.itemID){
        let found = false;
        let itemFound = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id == parseInt(req.body.itemID)) {
                found = true;
                itemFound = items[i]
                break;
            }
        }
        if(found){
            const item = itemFound;
            if (cookies['bagID']) {
                if (bags.has(cookies['bagID'])) {
                    const bag = bags.get(cookies['bagID']);
                    let prodFound = false;
                    let prodNum = 0;
                    for (var i = 0; i < bag.length; i++) {
                        if (bag[i].details.id == parseInt(req.body.itemID)) {
                            prodFound = true;
                            prodNum = i;
                            break;
                        }
                    }
                    if (prodFound) {
                        let bagItem = bag[prodNum];
                        bagItem.amount ++;
                        bag[prodNum] = bagItem;
                        bags.set(cookies['bagID'], bag);
                        res.redirect('/');
                    }else{
                        bag.push({details: item, amount: 1});
                        bags.set(cookies['bagID'], bag);
                        res.redirect('/');
                    }
                } else {
                    res.clearCookie('bagID');
                    res.redirect("/");
                }
            } else {
                const newBag = [{ details: item, amount: 1 }];
                let newBagID = utils.idGenerator();
                bags.set(newBagID, newBag);
                res.cookie('bagID', newBagID, { maxAge: ((new Date().getTime()) + 1000 * 60 * 60 * 2) });
                res.redirect('/');
            }
        }else{
            res.status(404);
            res.send("No Item found with that ID");
        }
    }else{
        res.status(400);
        res.send("Please make sure the itemID field is present.");
    }
})