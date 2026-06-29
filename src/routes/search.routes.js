const express=require("express");

const router=express.Router();

const {
searchBus
}=require("../controllers/search.controller");

router.get("/",searchBus);

module.exports=router;
