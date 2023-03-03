/**
 * An example of how to get all lessons in room 41 of all classes.
 */

const parserClass = require("./ZstLessonPlanParser.js");

async function getLessonsInRoom41(){
    const allLessonsInRoom41 = new Array();
    for(let i=1; i<=28; i++){
        const parser = new parserClass(`http://zst.grudziadz.com.pl/plan/plany/o${i}.html`);
        console.log(`Parsing o${i}.html ...`);
        const allLessonsOfClass = await parser.getAllLessonsArray(true, true);
        const filteredArray = allLessonsOfClass.filter(e=>{
            return e.roomNumber=="41";
        });
        allLessonsInRoom41.push(...filteredArray);
    }
    return allLessonsInRoom41;
}

getLessonsInRoom41().then(async result=>console.table(result));