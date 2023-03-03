/**
 * Błażej Drozd - Tsugumik 
 * https://github.com/Tsugumik
 * All Rights Reserved
 */

const cheerio = require("cheerio");
const request = require("request-promise");

class Lesson {
    constructor(index, dayNumber, name, roomNumber, teacherID){
        this.index = index;
        this.dayNumber = dayNumber;
        this.name = name;
        this.roomNumber = roomNumber;
        this.teacherID = teacherID;
        this.groupedLesson = false;
        this.group=null;
        if(name.split("-").length>1){
            this.groupedLesson = true;
            this.group=name.split("-")[1];
        }
        this.nameWithoutGroup = this.groupedLesson ? name.split("-")[0] : this.name;
    }
}
/**
 * The module is used to parse the HTML lesson plan into an array of Lesson objects.
 * Only compatible with Vulcan Optivum HTML lesson plans.
 */
class ZstLessonPlanParser {
    constructor(url){
        this.url = url;
        this.requestOption = {
            uri: this.url
        };
    }
    /**
     * This function returns Promise that returns the html string of the lesson plan. Useful for debugging.
     * @returns {Promise<string>} HTML string of the school lesson plan.
     */
    getHtmlPromise(){
        return new Promise((resolve, reject)=>{
            request(this.requestOption, (error, response, html)=>{
                if(!error && response.statusCode == 200){
                    resolve(html);
                } else{
                    reject(error);
                }
            });
        });
    }
    /**
     * This async function returns Promise that returns the html string of the lesson plan. Useful for debugging.
     * Used by getAllLessonsArray async function.
     * @returns {Promise<string>} HTML string of the school lesson plan.
     */
    async getHTML(){
        const reponse = await request(this.requestOption);
        return await request(this.requestOption);
    }

    /**
     * This async function is used to parse the HTML lesson plan and transform it into an array of Lesson objects.
     * @param {bool} cached If there is a cached version of a lesson plan in memory, use it instead of reparsing.
     * @param {bool} sort Sorts the array by the number of the day in ascending order.
     * @returns {Promise<Lesson[]>} Array of Lesson objects.
     */
    async getAllLessonsArray(cached=true, sort=true){

        if(cached){
            if(sort && this.lessonPlanCacheSorted){
                return this.lessonPlanCacheSorted;
            }
            if(this.lessonPlanCache){
                return this.lessonPlanCache;
            }
        }

        const lessonsObjectsArray = new Array();

        const html = await this.getHTML();
        
        const $ = cheerio.load(html);

        $("table.tabela")
        .find("tr")
        .each((row, element) => {
            $(element).find(".l")
            .each((td, tddata)=>{
                const numberOfLessons = $(tddata).find(".p").length;
                const numberOfids = $(tddata).find(".n").length;
                const numberOfRooms = $(tddata).find(".s").length;
                if(numberOfLessons > 1){
                    const namesOfLessons = new Array();
                    const idsOfTeachers = new Array();
                    const numbersOfLessonRooms = new Array();
                    const dayIndex = td;
                    const lessonIndex = row-1;
                    $(tddata).find(".p").each((pi, p)=>{
                        namesOfLessons.push($(p).text());
                    });
                    $(tddata).find(".n").each((ni, n)=>{
                        idsOfTeachers.push($(n).text());
                    });
                    $(tddata).find(".s").each((si, s)=>{
                        numbersOfLessonRooms.push($(s).text());
                    });

                    let mliMax;

                    let sum = numberOfLessons + numberOfids + numberOfRooms;

                    if(sum==6){
                        mliMax = numberOfLessons;
                    } else {
                        mliMax = numberOfLessons-1;
                    }

                    for(let mli=0; mli<mliMax; mli++){
                        const lessonObject = new Lesson(
                            lessonIndex,
                            dayIndex,
                            namesOfLessons[mli],
                            numbersOfLessonRooms[mli],
                            /**
                             * Prevents errors caused by putting religion into the plan.
                             * Some religion lesson teachers have a wrong html class.
                             */
                            numberOfLessons != numberOfids ? namesOfLessons[mliMax] : idsOfTeachers[mli]
                        )

                        if(lessonObject.name!="") lessonsObjectsArray.push(lessonObject);
                    }

                } else {
                    
                    const nameOfLesson = $(tddata).find(".p").text();
                    const idOfTeacher = $(tddata).find(".n").text();
                    const numberOfLessonRoom = $(tddata).find(".s").text();
                    const dayIndex = td;
                    const lessonIndex = row-1;

                    const lessonObject = new Lesson(
                        lessonIndex,
                        dayIndex,
                        nameOfLesson,
                        numberOfLessonRoom,
                        idOfTeacher
                    );

                    if(lessonObject.name!="") lessonsObjectsArray.push(lessonObject);
                }
                
            })
        });
        if(sort){
            let lessonsArraySorted = lessonsObjectsArray.sort((a, b)=>{
                return a.dayNumber - b.dayNumber;
            });
            this.lessonPlanCacheSorted = lessonsArraySorted;
            return lessonsArraySorted
        }
        this.lessonPlanCache = lessonsObjectsArray;
        return lessonsObjectsArray;
    }

    /**
     * This async function is used to filter an array of Lesson objects by the number of the day.
     * @param {bool} cached If there is a cached version of a lesson plan in memory, use it instead of reparsing.
     * @param {number} day Day number between 0 and 4
     * @returns {Promise<Lesson[]>} Filtered array of Lesson objects by day.
     */
    async getLessonsByDay(cached=true, day=0){
        if(typeof day!="number" && (day<0 || day >4)){
            throw TypeError("Day must be a number between 0 and 4");
        }

        const allLessonsArray = await this.getAllLessonsArray(cached, false);

        const filteredLessonsArray = allLessonsArray.filter(e=>{
            return e.dayNumber==day;
        });

        return filteredLessonsArray;
    }
}


module.exports = ZstLessonPlanParser;