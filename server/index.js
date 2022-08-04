//@ts-check

//Dependancies
const express = require('express');
const path = require('path');
const items = require('./items.json');
const utils = require('./utils.js');

//Register Express App
const app = express();
//Set the folder where views come from
app.set('views', path.join(__dirname, '../', 'views'));
//Set the rendering engine as EJS
app.set('view engine', 'ejs');
//Make a static path for styles, images, etc
app.use('/public', express.static(path.join(__dirname, '../', 'public')));
//Allow URL encoded forms
app.use(express.urlencoded({extended: true}));\
//Listen on port 8080
app.listen(8080);

//Create new map for bags
const bags = new Map();

//Main index page
app.get("/", (req,res)=>{
    //Get cookies
    const cookies = utils.reqCookies(req);
    //Check cookies includes the bag ID
    if(cookies['bagID']){
        //Check the bagID exists
        if (bags.has(cookies['bagID'])){
            //Get the bag
            const bag = bags.get(cookies['bagID']);
            //Render the page
            res.render("index", {
                items, bag
            });
        }else{
            //Clear the cookie (it's invalid)
            res.clearCookie('bagID');
            //Restart the flow
            res.redirect("/");
        }
    }else{
        //Create a new bag
        const newBag = [];
        //Generate a new bag ID
        let newBagID = utils.idGenerator();
        //Enter the bag into the map
        bags.set(newBagID, newBag);
        //Add the cookie
        res.cookie('bagID', newBagID, {maxAge: ((new Date().getTime()) + 1000 * 60 * 60 * 2)});
        //Render the page
        res.render("index", {
            items, bag: newBag            
        });
    }
});

//View Bag page
app.get("/bag", (req, res) => {
    const cookies = utils.reqCookies(req);
    if (cookies['bagID']) {
        if (bags.has(cookies['bagID'])) {
            const bag = bags.get(cookies['bagID']);
            //Render the bag page
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

//Submit form path
app.post('/addToCart', (req,res) =>{
    const cookies = utils.reqCookies(req);
    //Check for a item ID
    if(req.body.itemID){
        //Declare found boolean 
        let found = false;
        //Declare found data
        let itemFound = null;
        //For loop every item in map
        for (var i = 0; i < items.length; i++) {
            //Check if match
            if (items[i].id == parseInt(req.body.itemID)) {
                found = true;
                itemFound = items[i]
                break;
            }
        }
        //If something was found
        if(found){
            //Scope it
            const item = itemFound;
            if (cookies['bagID']) {
                if (bags.has(cookies['bagID'])) {
                    const bag = bags.get(cookies['bagID']);
                    //Decleare already in bag vars
                    let prodFound = false;
                    let prodNum = 0;
                    for (var i = 0; i < bag.length; i++) {
                        if (bag[i].details.id == parseInt(req.body.itemID)) {
                            prodFound = true;
                            prodNum = i;
                            break;
                        }
                    }
                    //If already in cart
                    if (prodFound) {
                        let bagItem = bag[prodNum];
                        //Increment Amount
                        bagItem.amount ++;
                        //Update entry in bag
                        bag[prodNum] = bagItem;
                        // Update bag in map
                        bags.set(cookies['bagID'], bag);
                        // Redirect to home
                        res.redirect('/');
                    }else{
                        //Add to bag
                        bag.push({details: item, amount: 1});
                        //Update in map
                        bags.set(cookies['bagID'], bag);
                        res.redirect('/');
                    }
                } else {
                    res.clearCookie('bagID');
                    res.redirect("/");
                }
            } else {
                //Create new bag with item in it
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
