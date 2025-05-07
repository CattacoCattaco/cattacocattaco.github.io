const inventoryItemsList = document.getElementById("Inventory all items list");

const settingsMenu = document.getElementById("settings-area");

const fileInput = document.getElementById("file-input");

const dayPercentLeftElement = document.getElementById("day-percent-left");

const timeElement = document.getElementById("time");

const seasons = [["Spring(Planting)", "rgb(50, 220, 120)"], ["Summer(Animal Prep)", "rgb(255, 225, 55)"], ["Fall(Harvest)", "rgb(225, 76, 46)"], ["Winter(Misc)", "rgb(148, 198, 227)"]]; //Season names and their colors
const seasonSplits = [91, 182, 273, 364]; //Last day of each season
const seasonDayOffsets = [-1, 91, 182, 273]; //How much to subtract from day to get date (day 0 = Spring 1st, day 92 = Summer 1st, etc.)
var currentSeason = "Spring(Planting)";
var currentSeasonIndex = 0;
var currentDay = 364; //Current day of the year
var year = 799; //Current year

var dayPercentLeft = 100;

//items which use percentage
const percentageifiedItems = ["Energy","Nourishment","Hydration","Animal nourishment"];
//items which can't be split
const nonpartialables = ["Butter","Calf","Cattle","Cheese","Chick","Chicken","Damaged tools","Disrepaired fencing","Dying cattle","Dying chicken","Egg","Harvested crops","Piece of bread","Preserved meat","Unpreserved meat"];
var startingInventory = {
   "Energy": 100,
   "Nourishment": 100,
   "Hydration": 100,
   "Animal nourishment": 100,
   "100%": 1,
   "Seeds": 50,
   "Unpreserved meat": 0,
   "Preserved meat": 20,
   "Piece of bread": 50,
   "Dying cattle": 1,
   "Cattle": 3,
   "Chicken": 4,
};

var inventory = startingInventory;

var settings = {
   "doNewDayAlert": true,
   "doTaskCompleteAlert": true,
   "doNotEnoughTimeAlert": true,
   "doNewSeasonWarningAlert": true,
   "doDamageAlert": true,
};

//Objectives in format [task, steps, objective probability as decimal based on factors]
//Steps in format [name, rewards, time usage, quantity(-1 = unlimited), requirements, bonuses]
//Bonuses in format [bonus giver, min bonus, max bonus, use bonus giver?, bonus type]
//Bonus types: "Amount" = improves reward amount, "Uses" = increases quantity, only uses min bonus
var seasonalObjectives = [
   [
      ["Spread manure over hayfields", [
         ["Spread manure over hayfields", [["Grass for grazing", 5]], 0.5, 40, [], []]
      ], [[1, "100%"]]],
      ["Plant crops", [
         ["Break soil via ards", [["Broken Soil", 1]], 0.5, 45, [], []],
         ["Sow seeds", [["Sowed seeds",1]], 1, 45, [["Seeds", 1], ["Broken Soil", 1]], []],
         ["Sacrifice food to the gods", [["Blessed soil", 1]], 0.1, 1, [["Piece of bread", 3], ["Egg", 2], ["Liter of beer", 1]], []]
      ], [[1, "100%"]]],
   ],
   [
      ["Make butter and cheese", [
         ["Churn milk into butter and cheese", [["Cheese", 1], ["Butter", 1]], 0.5, -1, [["Liter of milk", 6]], []]
      ], [[1, "100%"]]],
      ["Slaughter Dying cattle",[
         ["Slaughter Dying cattle",[["Unpreserved meat",10]], 0.5, -1, [["Dying cattle", 1]], []],
      ], [[1, "Dying cattle"]]],
      ["Slaughter Dying chicken", [
         ["Slaughter Dying chicken", [["Unpreserved meat", 4]], 0.5, -1, [["Dying chicken", 1]], []],
      ], [[1, "Dying chicken"]]],
   ],
   [
      ["Harvest crops", [
         ["Harvest crops", [["Seeds", 0.8], ["Harvested crops", 2]], 1, 90, [["Sowed seeds", 0.5]], [["blessed soil", 1.2, 2, true, "Amount"]]]
      ], [[1, "100%"]]],
   ],
   [

   ]
];
var yearRoundObjectives = [
];
var dailyObjectives = [
   ["Milk cows", [
      ["Milk cows", [["Liter of milk", 6]], 0.1, 1, [["Cattle", -1]], [["Cattle", 1, 1, false, "Uses"]]]
   ], [[1, "100%"]]],
   ["Collect eggs", [
      ["Collect eggs", [["Egg", 1]], 0.1, 1, [["Chicken", -1]], [["Chicken", 1, 1, false, "Uses"]]]
   ], [[1, "100%"]]],
   ["Feed cattle", [
      ["Feed livestock", [["Animal nourishment", 10]], 0.6, 3, [["Grass for grazing", 1]]]
   ], [[1, "100%"]]],
   ["Feed yourself meat", [
      ["Eat meat", [["Nourishment", 15], ["Energy", 4]], 0.1, 40, [["Preserved meat", 1]]]
   ], [[1, "100%"]]],
   ["Feed yourself bread", [
      ["Eat bread", [["Nourishment", 7], ["Energy", 2]], 0.1, 40, [["Piece of bread", 1]]]
   ], [[1, "100%"]]],
   ["Feed yourself cheese", [
      ["Eat cheese", [["Nourishment", 9], ["Energy", 3]], 0.1, 40, [["Cheese", 1]]]
   ], [[1, "100%"]]],
   ["Hydrate yourself", [
      ["Drink water", [["Hydration", 8]], 0.1, 40, []]
   ], [[1, "100%"]]],
   ["Drink(beer)", [
      ["Drink beer", [["Hydration", 15], ["Energy", 0.4]], 0.1, 40, [["Liter of beer", 1]]]
   ], [[1, "100%"]]],
   ["Make bread", [
      ["Make bread", [["Piece of bread", 3]], 0.25, 15, [["Harvested crops", 1]]]
   ], [[1,"100%"]]],
   ["Make beer", [
      ["Make beer", [["Liter of beer", 2]], 0.1, 15, [["Harvested crops", 1]]]
   ], [[1,"100%"]]],
   ["Preserve meat", [
      ["Preserve meat", [["Preserved meat", 1]], 0.1, 15, [["Unpreserved meat", 1]]]
   ], [[1,"100%"]]],
   ["Repair fencing", [
      ["Repair fencing", [], 1, -1, [["Disrepaired fencing", 1]]]
   ], [[1,"Disrepaired fencing"]]],
   ["Repair tools", [
      ["Repair tools", [], 1, -1, [["Damaged tools", 1]]]
   ], [[1,"Damaged tools"]]],
]

//Tasks in format [objective, [step, step instance],completed?]
var currentTasks = [
   [seasonalObjectives[0][0],[0,0],false],
   [seasonalObjectives[0][1],[0,0],false]
];

var currentDailyTasks = [
   [dailyObjectives[0],[0,0],false],
];

const maxObjectiveCount = 5;//Starts at 0
const maxDailyObjectiveCount = 19;//Starts at 0

const downloadToFile = (content, filename, contentType) => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });

  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};

var selectedFile;

// get the value every time the user selects a new file
fileInput.addEventListener("change", (e) => {
  // e.target points to the input element
  selectedFile = e.target.files[0]
})

window.onload = newGame();

function newGame()
{
   document.getElementById("do_new_day_alert").addEventListener('input', newDaySettingChange, false);
   document.getElementById("do_task_complete_alert").addEventListener('input', taskCompleteSettingChange, false);
   document.getElementById("do_not_enough_time_alert").addEventListener('input', notEnoughTimeSettingChange, false);
   document.getElementById("do_new_season_warning_alert").addEventListener('input', newSeasonSettingChange, false);
   document.getElementById("do_damage_alert").addEventListener('input', damageSettingChange, false);

   if(localStorage.getItem("VFS_inventory") && (localStorage.getItem("VFS_lost") != "true"))
   {
      loadFromBrowser();
   }
   else
   {
      if(localStorage.getItem("VFS_settings"))
      {
         settings = JSON.parse(localStorage.getItem("VFS_settings"));
      }
      else 
      {
         for(var setting in settings)
         {
            settings[setting] = true;
         }
      }
      updateSettings()
      
      inventory = startingInventory
      updateInventoryList()

      currentDay = 364;
      year = 799;

      currentTasks = [
         [seasonalObjectives[0][0],[0,0],false],
         [seasonalObjectives[0][1],[0,0],false]
      ];

      currentDailyTasks = [
         [dailyObjectives[0],[0,0],false],
      ];

      newDay();

      saveToBrowser();
   }
}

function newDaySettingChange(evt)
{
   settings["doNewDayAlert"] = !(settings["doNewDayAlert"]);

   saveToBrowser();
}

function taskCompleteSettingChange(evt)
{
   settings["doTaskCompleteAlert"] = !settings["doTaskCompleteAlert"];

   saveToBrowser();
}

function notEnoughTimeSettingChange(evt)
{
   settings["doNotEnoughTimeAlert"] = !settings["doNotEnoughTimeAlert"];

   saveToBrowser();
}

function newSeasonSettingChange(evt)
{
   settings["doNewSeasonWarningAlert"] = !settings["doNewSeasonWarningAlert"];

   saveToBrowser();
}

function damageSettingChange(evt)
{
   settings["doDamageAlert"] = !settings["doDamageAlert"];

   saveToBrowser();
}

function openSettings()
{
   settingsMenu.style.display="flex";
}

function closeSettings()
{
   settingsMenu.style.display="none";
}

//Save data to browser via localStorage
function saveToBrowser()
{
   localStorage.setItem("VFS_inventory", JSON.stringify(inventory));
   localStorage.setItem("VFS_settings", JSON.stringify(settings));
   localStorage.setItem("VFS_currentTasks", JSON.stringify(currentTasks));
   localStorage.setItem("VFS_currentDailyTasks", JSON.stringify(currentDailyTasks));
   localStorage.setItem("VFS_currentDay", JSON.stringify(currentDay));
   localStorage.setItem("VFS_dayPercentLeft", JSON.stringify(dayPercentLeft));
   localStorage.setItem("VFS_lost", "false");
}

//Load data from browser via localStorage
function loadFromBrowser()
{
   if(localStorage.getItem("VFS_inventory"))
   {
      inventory = JSON.parse(localStorage.getItem("VFS_inventory"));
   }
   if(localStorage.getItem("VFS_settings"))
   {
      settings = JSON.parse(localStorage.getItem("VFS_settings"));
   }
   if(localStorage.getItem("VFS_currentTasks"))
   {
      currentTasks = JSON.parse(localStorage.getItem("VFS_currentTasks"));
   }
   if(localStorage.getItem("VFS_currentDailyTasks"))
   {
      currentDailyTasks = JSON.parse(localStorage.getItem("VFS_currentDailyTasks"));
   }
   if(localStorage.getItem("VFS_currentDay"))
   {
      currentDay = JSON.parse(localStorage.getItem("VFS_currentDay"));
   }
   if(localStorage.getItem("VFS_dayPercentLeft"))
   {
      dayPercentLeft = JSON.parse(localStorage.getItem("VFS_dayPercentLeft"));
   }
   
   updateInventoryList();
   updateSettings();
   updateTasks();
   updateTime();
   updateTimeLeftInDay();
}

function saveToFile()
{
   // Data which will write in a file.
   var data = JSON.stringify(inventory) + "\n" + JSON.stringify(settings) + "\n" + JSON.stringify(currentTasks) + "\n" + JSON.stringify(currentDailyTasks) + "\n" + JSON.stringify(currentDay) + "\n" + JSON.stringify(dayPercentLeft) + "\n\n\n\n\n\n\n\n\n\n\n\n\n";

   // Write data in 'Vinking_framming_save.txt' .
   downloadToFile(data, 'Vinking_framming_save.txt', 'text/plain')
}

function loadFromFile()
{
   if (!selectedFile) return
   const reader = new FileReader()
   reader.onload = (e) => {
      // e.target points to the reader
      const textContent = e.target.result
      var data = textContent.split("\n");

      if(data[0])
      {
         inventory = JSON.parse(data[0]);
      }
      if(data[1])
      {
         settings = JSON.parse(data[1]);
      }
      if(data[2])
      {
         currentTasks = JSON.parse(data[2]);
      }
      if(data[3])
      {
         currentDailyTasks = JSON.parse(data[3]);
      }
      if(data[4])
      {
         currentDay = JSON.parse(data[4]);
      }
      if(data[5])
      {
         dayPercentLeft = JSON.parse(data[5]);
      }
      
      updateInventoryList();
      updateSettings();
      updateTasks();
      updateTime();
      updateTimeLeftInDay();
      
      console.log(`The content of ${selectedFile.name} is ${textContent}`)

      saveToBrowser();
   }
   reader.onerror = (e) => {
      const error = e.target.error
      console.error(`Error occured while reading ${file.name}`, error)
   }
   reader.readAsText(selectedFile);
}

function newDay()
{
   dayPercentLeft = 100;
   updateTimeLeftInDay();

   currentDay += 1;
   while(currentDay > 364)
   {
      year += 1;
      currentDay -= 365;
   }
   updateTime();
}

function sleep()
{
   var energy_gained = (dayPercentLeft > 0);
   changeInventoryCount("Energy", dayPercentLeft / 20);

   changeInventoryCount("Energy", -0.1);
   changeInventoryCount("Animal nourishment", -2.5);
   changeInventoryCount("Nourishment", -2.5);
   changeInventoryCount("Hydration", -15.0);

   for(i = 0; i < Math.floor(inventory["Cattle"] / 2); i++)
   {
      if(Math.random() < 0.15)
      {
         changeInventoryCount("Calf", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Cattle"]); i++)
   {
      if(Math.random() < (0.005 + (inventory["Disrepaired fencing"] * 0.01)))
      {
         changeInventoryCount("Cattle", -1);
         changeInventoryCount("Dying cattle", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Calf"]); i++)
   {
      if(Math.random() < 0.025)
      {
         changeInventoryCount("Calf", -1);
         changeInventoryCount("Cattle", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chicken"]/2); i++)
   {
      if(Math.random() < 0.15)
      {
         changeInventoryCount("Chick", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chicken"]); i++)
   {
      if(Math.random() < (0.005+(inventory["Disrepaired fencing"]*0.01)))
      {
         changeInventoryCount("Chicken", -1);
         changeInventoryCount("Dying chicken", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chick"]); i++)
   {
      if(Math.random() < 0.025)
      {
         changeInventoryCount("Chick", -1);
         changeInventoryCount("Chicken", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Unpreserved meat"]); i++)
   {
      if(Math.random() < 0.9)
      {
         changeInventoryCount("Unpreserved meat", -1);
         changeInventoryCount("Spoiled meat", 1);
      }
   }

   if(Math.random() < 0.01)
   {
      changeInventoryCount("Disrepaired fencing", 1);
      if(settings["doDamageAlert"])
      {

         window.alert("Your fencing has been damaged. You need to fix it or your animals will get injured more.");
      }
   }

   if(Math.random() < 0.015)
   {
      changeInventoryCount("Damaged tools", 1);
      if(settings["doDamageAlert"])
      {

         window.alert("Your tools have been damaged. You need to fix it or your production will be reduced.");
      }
   }
   
   newDay();

   if(settings["doNewDayAlert"])
   {
      if(energy_gained)
      {
         window.alert("It's a new day which means more time to get your tasks done! The season only has a finite amount of days so you need to be efficient. You feel a bit more energetic after taking a break yesterday. You can probably get your tasks done faster now.");
      }
      else
      {
         window.alert("It's a new day which means more time to get your tasks done! The season only has a finite amount of days so you need to be efficient.");
      }
   }

   switch(true)
   {
      case (inventory["Animal nourishment"] <= 0): 
         localStorage.setItem("VFS_lost", "true");
         window.alert("Your animals have died of starvation. You lose.");
         newGame();
         break;
      case (inventory["Nourishment"] <= 0):
         localStorage.setItem("VFS_lost", "true");
         window.alert("You have died of starvation. You lose.");
         newGame();
         break;
      case (inventory["Hydration"] <= 0):
         localStorage.setItem("VFS_lost", "true");
         window.alert("You have died of dehydration. You lose.");
         newGame();
         break;
      case (inventory["Energy"] <= 0):
         localStorage.setItem("VFS_lost", "true");
         window.alert("You have died of exhaustion. You lose.");
         newGame();
         break;
   }

   saveToBrowser();
}

function changeInventoryCount(name,change)
{
   if(inventory[name]>-10000000000)
   {
      inventory[name]=inventory[name]+change;
   }
   else
   {
      inventory[name]=change;
   }
   
   updateInventoryList();
   
   saveToBrowser();
}

function updateInventoryList()
{
   var inventory_list_text = "";
   for(var [key, value] of Object.entries(inventory))
   {
      if(percentageifiedItems.includes(key))
      {
         inventory_list_text += "- " + key + " " + floatToRoundedTenthsString(value) + "%<br>";
      }
      else if(nonpartialables.includes(key))
      {
         inventory_list_text += "- " + key + " x" + floatToRoundedWholesString(value) + "<br>";
      }
      else if(!(["100%"].includes(key)))
      {
         inventory_list_text += "- " + key + " x" + floatToRoundedTenthsString(value) + "<br>";
      }
   }
   inventoryItemsList.innerHTML = inventory_list_text;
}

function floatToRoundedTenthsString(number)
{
   var out = number.toFixed(1);
   if(out.includes(".0"))
   {
      out = out.replace(".0","");
   }
   return out;
}

function floatToRoundedWholesString(number)
{
   var out = number.toFixed(0);
   return out;
}

function doObjective(index, button, is_daily)
{
   var task;
   if(!is_daily)
   {
      task = currentTasks[index];
   }
   else
   {
      task = currentDailyTasks[index];
   }
   var step = task[0][1][task[1][0]];

   if(dayPercentLeft / 100 >= (step[2] / (inventory["Energy"] / 100)))
   {
      var requirements_met = true;
      for(var requirement in step[4])
      {
         requirement = step[4][requirement];
         if(!(inventory[requirement[0]]>=Math.abs(requirement[1])))
         {
            requirements_met = false;
         }
      }
      if(requirements_met)
      {
         var max_uses = step[3];
         var multiplier = 1;
         for(var bonus in step[5])
         {
            bonus = step[5][bonus];

            if(inventory[bonus[0]] > 0 & bonus[4] == "Amount")
            {
               var difference = bonus[2] - bonus[1];
               var bonus_amount = (bonus[1] + (difference * Math.random())) * inventory[bonus[0]];
               multiplier *= bonus_amount;

               if(bonus[3])
               {
                  changeInventoryCount(bonus[0], -inventory[bonus[0]]);
               }
            }
            else if(inventory[bonus[0]] > 0 & bonus[4] == "Uses")
            {
               var bonus_amount = bonus[1] * inventory[bonus[0]];
               max_uses *= bonus_amount;

               if(bonus[3])
               {
                  changeInventoryCount(bonus[0], -inventory[bonus[0]]);
               }
            }
         }

         if(inventory["Damaged tools"]>0)
         {
            multiplier*=(0.9**inventory["Damaged tools"]);
         }

         for(var reward in step[1])
         {
            reward = step[1][reward];
            changeInventoryCount(reward[0],reward[1]*multiplier);
         }
         for(var requirement in step[4])
         {
            requirement = step[4][requirement];
            if(requirement[1]>0)
            {
               changeInventoryCount(requirement[0],-requirement[1]);
            }
         }
         dayPercentLeft-= ((step[2]*100) / (inventory["Energy"]/100));
         updateTimeLeftInDay();

         task[1][1]+=1;

         var completed = false;

         if(task[1][1] == max_uses)
         {
            task[1][0] = task[1][0]+1;
            if(task[0][1].length <= task[1][0])
            {
               if(settings["doTaskCompleteAlert"])
               {
                  window.alert("Task complete!");
               }
               task[2] = true;
               button.className="hide";
               button.parentElement.className="button-container-hide";
               completed=true;
            }
            else
            {
               task[1][1] = 0;
            }
         }

         if(!completed)
         {
            var new_button_text = getDesiredObjectiveButtonText(task);
            button.innerHTML = new_button_text;
         }
      }
      else
      {
         window.alert("You do not meet the requirements for this action. (You are missing one or more of the listed items)");
      }
   }
   else
   {
      if(settings["doNotEnoughTimeAlert"])
      {
         window.alert("You don't have enough time left to do this today.");
      }
   }

   saveToBrowser();
}

function updateTime()
{
   var old_season = currentSeason;
   switch(true)
   {
      case currentDay <= seasonSplits[0]:
         currentSeasonIndex = 0;
         break;
      case currentDay <= seasonSplits[1]:
         currentSeasonIndex = 1;
         break;
      case currentDay <= seasonSplits[2]:
         currentSeasonIndex = 2;
         break;
      case currentDay <= seasonSplits[3]:
         currentSeasonIndex = 3;
         break;
   }
   currentSeason = seasons[currentSeasonIndex][0];
   timeElement.style.color = seasons[currentSeasonIndex][1];

   var time_string = "";
   time_string += currentSeason + "	 ";

   var date_without_ending = currentDay-seasonDayOffsets[currentSeasonIndex];

   if(date_without_ending > 10 & date_without_ending < 20)
   {
      time_string += date_without_ending + "th";
   }
   else
   {
      switch(date_without_ending % 10)
      {
         case 1:
            time_string += date_without_ending + "st";
            break;
         case 2:
            time_string += date_without_ending + "nd";
            break;
         case 3:
            time_string += date_without_ending + "rd";
            break;
         default:
            time_string += date_without_ending + "th";
            break;
      }
   }

   time_string += ",   Year " + year;

   timeElement.innerHTML = time_string;

   if(seasonSplits.includes(currentDay) && settings["doNewSeasonWarningAlert"])
   {
      window.alert("Warning: Tomorrow is a new season!")
   }

   currentDailyTasks = [];
   for(var i = 0; i < maxDailyObjectiveCount; i++)
   {
      var button = getDailyObjectiveButton(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }

   var objective_index_in_currentDailyTasks = 0;
   for(var objective in dailyObjectives)
   {
      objective = dailyObjectives[objective];

      var objective_probability = 0;
      for(var probability_contributer in objective[2])
      {
         probability_contributer = objective[2][probability_contributer];
         objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
      }

      if(Math.random() < objective_probability)
      {
         //add the task to currentDailyTasks at instance 0 of step 0
         var new_task = [objective, [0,0] , false]
         currentDailyTasks.push(new_task);

         var button = getDailyObjectiveButton(objective_index_in_currentDailyTasks);
         button.innerHTML = getDesiredObjectiveButtonText(new_task);
         button.className="show";
         button.parentElement.className="button-container-show";

         objective_index_in_currentDailyTasks += 1;
      }
   }

   if(old_season != currentSeason)
   {
      if(currentSeason == "Winter(Misc)")
      {
         inventory["Dying cattle"] = 0;
      }
      currentTasks = [];
      for(var i = 0; i < maxObjectiveCount; i++)
      {
         var button = getObjectiveButton(i);
         button.className="hide";
         button.parentElement.className="button-container-hide";
      }

      var objective_index_in_currentTasks = 0;
      for(var objective in seasonalObjectives[currentSeasonIndex])
      {
         objective = seasonalObjectives[currentSeasonIndex][objective];

         var objective_probability = 0;
         for(var probability_contributer in objective[2])
         {
            probability_contributer = objective[2][probability_contributer];
            objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
         }

         if(Math.random() < objective_probability)
         {
            //add the task to currentTasks at instance 0 of step 0
            currentTasks.push([objective,[0,0],false]);

            var button = getObjectiveButton(objective_index_in_currentTasks);
            button.innerHTML = getDesiredObjectiveButtonText([objective,[0,0],false]);
            button.className="show";
            button.parentElement.className="button-container-show";

            objective_index_in_currentTasks += 1;
         }
      }

      for(var objective in yearRoundObjectives)
      {
         objective = yearRoundObjectives[objective];

         var objective_probability = 0;
         for(var probability_contributer in objective[2])
         {
            probability_contributer = objective[2][probability_contributer];
            objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
         }

         if(Math.random() < objective_probability)
         {
            //add the task to currentTasks at instance 0 of step 0
            currentTasks.push([objective,[0,0],false]);

            var button = getObjectiveButton(objective_index_in_currentTasks);
            button.innerHTML = getDesiredObjectiveButtonText([objective,[0,0],false]);
            button.className="show";
            button.parentElement.className="button-container-show";

            objective_index_in_currentTasks += 1;
         }
      }
   }

   if(year>=1050)
   {
      window.alert("You have somehow managed to make it through the entire Viking age. Realistically, you probably should have died a while ago. Instead, you win!!!");
   }
}

function updateTasks()
{
   for(var i = 0; i < maxObjectiveCount; i++)
   {
      var button = getObjectiveButton(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }
   for(var i in currentTasks)
   {
      var task = currentTasks[i];

      var button = getObjectiveButton(i);
      button.innerHTML = getDesiredObjectiveButtonText(task);
      button.className="show";
      button.parentElement.className="button-container-show";
   }

   for(var i = 0; i < maxDailyObjectiveCount; i++)
   {
      var button = getDailyObjectiveButton(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }
   for(var i in currentDailyTasks)
   {
      var task = currentDailyTasks[i];

      var button = getDailyObjectiveButton(i);
      button.innerHTML = getDesiredObjectiveButtonText(task);
      button.className="show";
      button.parentElement.className="button-container-show";
   }
}

function updateTimeLeftInDay()
{
   dayPercentLeftElement.innerHTML = floatToRoundedTenthsString(dayPercentLeft) + "% of day left";
}

function updateSettings() 
{
   var initial_settings = settings;
   for(var setting in initial_settings)
   {
      document.getElementById(setting).checked = initial_settings[setting];
   }
   settings = initial_settings;
}

function getObjectiveButton(button_num)
{
   return document.getElementById("objective-" + button_num + "-button");
}

function getDailyObjectiveButton(button_num)
{
   return document.getElementById("daily-objective-" + button_num + "-button");
}

function getDesiredObjectiveButtonText(task) 
{
   var step = task[0][1][task[1][0]];
   var text_to_display = ""

   text_to_display += step[0] + ": -" + step[2] + " days";

   for(requirement in step[4])
   {
      requirement = step[4][requirement];
      if(requirement[1]>0)
      {
         text_to_display += ", -" + requirement[0] + " x" + floatToRoundedTenthsString(requirement[1]);
      }
      else
      {
         text_to_display += ", requires " + requirement[0] + " x" + floatToRoundedTenthsString(-requirement[1]);
      }
   }

   if(step[3] > 0)
   {
      var max_uses = step[3];

      for(var bonus in step[5])
      {
         bonus = step[5][bonus]

         if(inventory[bonus[0]] > 0 & bonus[4] == "Uses")
         {
            var bonus_amount = bonus[1] * inventory[bonus[0]];
            max_uses *= bonus_amount;

            if(bonus[3])
            {
               changeInventoryCount(bonus[0], -inventory[bonus[0]]);
            }
         }
      }

      text_to_display += " (" + task[1][1] + "/" + max_uses + ")";
   }
   else
   {
      text_to_display += " (" + task[1][1] + "/unlimited)";
   }

   return text_to_display;
}