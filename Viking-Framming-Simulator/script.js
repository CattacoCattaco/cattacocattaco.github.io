const inventory_items_list = document.getElementById("Inventory all items list");

const settings_menu = document.getElementById("settings-area");

const file_input = document.getElementById("file-input");

const day_percent_left_element = document.getElementById("day-percent-left");

const time_element = document.getElementById("time");

const seasons = [["Spring(Planting)", "rgb(50, 220, 120)"], ["Summer(Animal Prep)", "rgb(255, 255, 5)"], ["Fall(Harvest)", "rgb(235, 66, 46)"], ["Winter(Misc)", "rgb(148, 198, 227)"]]; //Season names and their colors
const season_splits = [91, 182, 273, 364]; //Last day of each season
const season_day_offsets = [-1, 91, 182, 273]; //How much to subtract from day to get date (day 0 = Spring 1st, day 92 = Summer 1st, etc.)
var current_season = "Spring(Planting)";
var current_season_index = 0;
var current_day = 364; //Current day of the year
var year = 799; //Current year

var day_percent_left = 100;

//items which use percentage
const percentageified_items = ["Energy","Nourishment","Hydration","Animal nourishment"];
//items which can't be split
const nonpartialables = ["Butter","Calf","Cattle","Cheese","Chick","Chicken","Damaged tools","Disrepaired fencing","Dying cattle","Dying chicken","Egg","Harvested crops","Piece of bread","Preserved meat","Unpreserved meat"];
var inventory = {
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

var settings = {
   "do_new_day_alert": true,
   "do_task_complete_alert": true,
   "do_not_enough_time_alert": true,
   "do_new_season_warning_alert": true,
   "do_damage_alert": true,
};

//Objectives in format [task, steps, objective probability as decimal based on factors]
//Steps in format [name, rewards, time usage, quantity(-1 = unlimited),requirements,bonuses]
//bonuses in format [bonus giver, min bonus, max bonus, use bonus giver?]
var seasonal_objectives = [
   [
      ["Spread manure over hayfields",[
         ["Spread manure over hayfields",[["Grass for grazing",5]], 0.5, 40,[],[]]
      ],[[1,"100%"]]],
      ["Plant crops",[
         ["Break soil via ards",[["Broken Soil",1]], 0.5, 45,[]],
         ["Sow seeds",[["Sowed seeds",1]], 1, 45,[["Seeds",1],["Broken Soil",1]]],
         ["Sacrifice food to the gods",[["Blessed soil",1]], 0.1, 1,[["Piece of bread",3],["Egg",2],["Liter of beer",1]]]
      ],[[1,"100%"]],[]],
   ],
   [
      ["Make butter and cheese",[
         ["Churn milk into butter and cheese",[["Cheese",1],["Butter",1]], 0.5, -1,[["Liter of milk",6]],[]]
      ],[[1,"100%"]]],
      ["Slaughter Dying cattle",[
         ["Slaughter Dying cattle",[["Unpreserved meat",10]], 0.5, -1,[["Dying cattle",1]],[]],
      ],[[1,"Dying cattle"]]],
      ["Slaughter Dying chicken",[
         ["Slaughter Dying chicken",[["Unpreserved meat",4]], 0.5, -1,[["Dying chicken",1]],[]],
      ],[[1,"Dying chicken"]]],
   ],
   [
      ["Harvest crops",[
         ["Harvest crops",[["Seeds",0.8],["Harvested crops",2]], 1, 90,[["Sowed seeds", 0.5]],[["blessed soil",1.2,2,true]]]
      ],[[1,"100%"]]],
   ],
   [

   ]
];
var year_round_objectives = [
];
var daily_objectives = [
   ["Milk cows",[
      ["Milk cows",[["Liter of milk",6]], 0.1, 2,[["Cattle",-1]],[["Cattle",0.5,1.5,false]]],
   ],[[1,"100%"]]],
   ["Collect eggs",[
      ["Collect eggs",[["Egg",1]], 0.1, 2,[["Chicken",-2]],[["Chicken",0.5,1,false]]],
   ],[[1,"100%"]]],
   ["Feed cattle",[
      ["Feed livestock",[["Animal nourishment",10]], 0.6, 3,[["Grass for grazing",1]]]
   ],[[1,"100%"]],[]],
   ["Feed yourself meat",[
      ["Eat meat",[["Nourishment",15],["Energy",4]], 0.1, 40,[["Preserved meat",1]]]
   ],[[1,"100%"]],[]],
   ["Feed yourself bread",[
      ["Eat bread",[["Nourishment",7],["Energy",2]], 0.1, 40,[["Piece of bread",1]]]
   ],[[1,"100%"]],[]],
   ["Feed yourself cheese",[
      ["Eat cheese",[["Nourishment",9],["Energy",3]], 0.1, 40,[["Cheese",1]]]
   ],[[1,"100%"]],[]],
   ["Hydrate yourself",[
      ["Drink water",[["Hydration",8]], 0.1, 40,[]]
   ],[[1,"100%"]],[]],
   ["Drink(beer)",[
      ["Drink beer",[["Hydration",15],["Energy",0.4]], 0.1, 40,[["Liter of beer",1]]]
   ],[[1,"100%"]],[]],
   ["Make bread",[
      ["Make bread",[["Piece of bread",3]], 0.25, 15,[["Harvested crops",1]]]
   ],[[1,"100%"]],[]],
   ["Make beer",[
      ["Make beer",[["Liter of beer",2]], 0.1, 15,[["Harvested crops",1]]]
   ],[[1,"100%"]],[]],
   ["Preserve meat",[
      ["Preserve meat",[["Preserved meat",1]], 0.1, 15,[["Unpreserved meat",1]]]
   ],[[1,"100%"]],[]],
   ["Repair fencing",[
      ["Repair fencing",[], 1, -1,[["Disrepaired fencing",1]],[]]
   ],[[1,"Disrepaired fencing"]]],
   ["Repair tools",[
      ["Repair tools",[], 1, -1,[["Damaged tools",1]],[]]
   ],[[1,"Damaged tools"]]],
]

//Tasks in format [objective, [step, step instance],completed?]
var current_tasks = [
   [seasonal_objectives[0][0],[0,0],false],
   [seasonal_objectives[0][1],[0,0],false]
];

var current_daily_tasks = [
   [daily_objectives[0],[0,0],false],
];

const max_objective_count = 5;//Starts at 0
const max_daily_objective_count = 19;//Starts at 0

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
file_input.addEventListener("change", (e) => {
  // e.target points to the input element
  selectedFile = e.target.files[0]
})

window.onload = new_game();

function new_game()
{
   new_day();

   document.getElementById("do_new_day_alert").addEventListener('input', new_day_setting_change, false);
   document.getElementById("do_task_complete_alert").addEventListener('input', task_complete_setting_change, false);
   document.getElementById("do_not_enough_time_alert").addEventListener('input', not_enough_time_setting_change, false);
   document.getElementById("do_new_season_warning_alert").addEventListener('input', new_season_setting_change, false);
   document.getElementById("do_damage_alert").addEventListener('input', damage_setting_change, false);

   if(localStorage.getItem("inventory") && (localStorage.getItem("lost") != "true"))
   {
      load_from_browser();
   }
   else
   {
      save_to_browser();
   }
}

function new_day_setting_change(evt)
{
   settings["do_new_day_alert"] = !(settings["do_new_day_alert"]);

   save_to_browser();
}

function task_complete_setting_change(evt)
{
   settings["do_task_complete_alert"] = !settings["do_task_complete_alert"];

   save_to_browser();
}

function not_enough_time_setting_change(evt)
{
   settings["do_not_enough_time_alert"] = !settings["do_not_enough_time_alert"];

   save_to_browser();
}

function new_season_setting_change(evt)
{
   settings["do_new_season_warning_alert"] = !settings["do_new_season_warning_alert"];

   save_to_browser();
}

function damage_setting_change(evt)
{
   settings["do_damage_alert"] = !settings["do_damage_alert"];

   save_to_browser();
}

function open_settings()
{
   settings_menu.style.display="flex";
}

function close_settings()
{
   settings_menu.style.display="none";
}

//Save data to browser via localStorage
function save_to_browser()
{
   localStorage.setItem("inventory",JSON.stringify(inventory));
   localStorage.setItem("settings",JSON.stringify(settings));
   localStorage.setItem("current_tasks",JSON.stringify(current_tasks));
   localStorage.setItem("current_daily_tasks",JSON.stringify(current_daily_tasks));
   localStorage.setItem("current_day",JSON.stringify(current_day));
   localStorage.setItem("day_percent_left",JSON.stringify(day_percent_left));
   localStorage.setItem("lost","false");
}

//Load data from browser via localStorage
function load_from_browser()
{
   if(localStorage.getItem("inventory"))
   {
      inventory = JSON.parse(localStorage.getItem("inventory"));
   }
   if(localStorage.getItem("settings"))
   {
      settings = JSON.parse(localStorage.getItem("settings"));
   }
   if(localStorage.getItem("current_tasks"))
   {
      current_tasks = JSON.parse(localStorage.getItem("current_tasks"));
   }
   if(localStorage.getItem("current_daily_tasks"))
   {
      current_daily_tasks = JSON.parse(localStorage.getItem("current_daily_tasks"));
   }
   if(localStorage.getItem("current_day"))
   {
      current_day = JSON.parse(localStorage.getItem("current_day"));
   }
   if(localStorage.getItem("day_percent_left"))
   {
      day_percent_left = JSON.parse(localStorage.getItem("day_percent_left"));
   }
   
   update_inventory_list();
   update_settings();
   update_tasks();
   update_time();
   update_time_left_in_day();
}

function save_to_file()
{
   // Data which will write in a file.
   var data = JSON.stringify(inventory) + "\n" + JSON.stringify(settings) + "\n" + JSON.stringify(current_tasks) + "\n" + JSON.stringify(current_daily_tasks) + "\n" + JSON.stringify(current_day) + "\n" + JSON.stringify(day_percent_left) + "\n\n\n\n\n\n\n\n\n\n\n\n\n";

   // Write data in 'Vinking_framming_save.txt' .
   downloadToFile(data, 'Vinking_framming_save.txt', 'text/plain')
}

function load_from_file()
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
         current_tasks = JSON.parse(data[2]);
      }
      if(data[3])
      {
         current_daily_tasks = JSON.parse(data[3]);
      }
      if(data[4])
      {
         current_day = JSON.parse(data[4]);
      }
      if(data[5])
      {
         day_percent_left = JSON.parse(data[5]);
      }
      
      update_inventory_list();
      update_settings();
      update_tasks();
      update_time();
      update_time_left_in_day();
      
      console.log(`The content of ${selectedFile.name} is ${textContent}`)

      save_to_browser();
   }
   reader.onerror = (e) => {
      const error = e.target.error
      console.error(`Error occured while reading ${file.name}`, error)
   }
   reader.readAsText(selectedFile);
}

function new_day()
{
   day_percent_left = 100;
   update_time_left_in_day();

   current_day+=1;
   while(current_day > 364)
   {
      year+=1;
      current_day-=365;
   }
   update_time();
}

function sleep()
{
   var energy_gained = (day_percent_left > 0);
   change_inventory_count("Energy", day_percent_left/17);

   change_inventory_count("Energy",-0.1);
   change_inventory_count("Animal nourishment",-2.5);
   change_inventory_count("Nourishment",-2.5);
   change_inventory_count("Hydration",-2.5);

   for(i = 0; i < Math.floor(inventory["Cattle"]/2); i++)
   {
      if(Math.random() < 0.15)
      {
         change_inventory_count("Calf", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Cattle"]); i++)
   {
      if(Math.random() < (0.005+(inventory["Disrepaired fencing"]*0.01)))
      {
         change_inventory_count("Cattle", -1);
         change_inventory_count("Dying cattle", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Calf"]); i++)
   {
      if(Math.random() < 0.025)
      {
         change_inventory_count("Calf", -1);
         change_inventory_count("Cattle", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chicken"]/2); i++)
   {
      if(Math.random() < 0.15)
      {
         change_inventory_count("Chick", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chicken"]); i++)
   {
      if(Math.random() < (0.005+(inventory["Disrepaired fencing"]*0.01)))
      {
         change_inventory_count("Chicken", -1);
         change_inventory_count("Dying chicken", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Chick"]); i++)
   {
      if(Math.random() < 0.025)
      {
         change_inventory_count("Chick", -1);
         change_inventory_count("Chicken", 1);
      }
   }

   for(i = 0; i < Math.floor(inventory["Unpreserved meat"]); i++)
   {
      if(Math.random() < 0.9)
      {
         change_inventory_count("Unpreserved meat", -1);
         change_inventory_count("Spoiled meat", 1);
      }
   }

   if(Math.random() < 0.01)
   {
      change_inventory_count("Disrepaired fencing", 1);
      if(settings["do_damage_alert"])
      {

         window.alert("Your fencing has been damaged. You need to fix it or your animals will get injured more.");
      }
   }

   if(Math.random() < 0.015)
   {
      change_inventory_count("Damaged tools", 1);
      if(settings["do_damage_alert"])
      {

         window.alert("Your tools have been damaged. You need to fix it or your production will be reduced.");
      }
   }
   
   new_day();

   console.log(settings["do_new_day_alert"]);

   if(settings["do_new_day_alert"])
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
      case (inventory["Animal nourishment"]<=0): 
         window.alert("Your animals have died of starvation. You lose.");
         localStorage.setItem("lost","true");
         location.reload();
         break;
      case (inventory["Nourishment"]<=0):
         window.alert("You have died of starvation. You lose.");
         localStorage.setItem("lost","true");
         location.reload();
         break;
      case (inventory["Hydration"]<=0):
         window.alert("You have died of dehydration. You lose.");
         localStorage.setItem("lost","true");
         location.reload();
         break;
      case (inventory["Energy"]<=0):
         window.alert("You have died of exhaustion. You lose.");
         localStorage.setItem("lost","true");
         location.reload();
         break;
   }

   save_to_browser();
}

function change_inventory_count(name,change)
{
   console.log(name);
   
   if(inventory[name]>-10000000000)
   {
      inventory[name]=inventory[name]+change;
   }
   else
   {
      inventory[name]=change;
   }
   
   update_inventory_list();
   
   save_to_browser();
}

function update_inventory_list()
{
   var inventory_list_text = "";
   for(var [key, value] of Object.entries(inventory))
   {
      if(percentageified_items.includes(key))
      {
         inventory_list_text += "- " + key + " " + float_to_rounded_tenths_string(value) + "%<br>";
      }
      else if(nonpartialables.includes(key))
      {
         inventory_list_text += "- " + key + " x" + float_to_rounded_wholes_string(value) + "<br>";
      }
      else if(!(["100%"].includes(key)))
      {
         inventory_list_text += "- " + key + " x" + float_to_rounded_tenths_string(value) + "<br>";
      }
   }
   inventory_items_list.innerHTML = inventory_list_text;
}

function float_to_rounded_tenths_string(number)
{
   var out = number.toFixed(1);
   if(out.includes(".0"))
   {
      out = out.replace(".0","");
   }
   return out;
}

function float_to_rounded_wholes_string(number)
{
   var out = number.toFixed(0);
   return out;
}

function do_objective(index, button, is_daily)
{
   var task;
   if(!is_daily)
   {
      task = current_tasks[index];
   }
   else
   {
      task = current_daily_tasks[index];
   }
   var step = task[0][1][task[1][0]];

   if(day_percent_left/100 >= (step[2] / (inventory["Energy"]/100)))
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
         var multiplier = 1;
         for(var bonus in step[5])
         {
            bonus = step[5][bonus];

            if(inventory[bonus[0]]>0)
            {
               var difference = bonus[2]-bonus[1];
               var bonus_amount = (bonus[1]+(difference*Math.random()))*inventory[bonus[0]];
               multiplier *= bonus_amount;
               if(bonus[3])
               {
                  change_inventory_count(bonus[0],-inventory[bonus[0]]);
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
            change_inventory_count(reward[0],reward[1]*multiplier);
         }
         for(var requirement in step[4])
         {
            requirement = step[4][requirement];
            if(requirement[1]>0)
            {
               change_inventory_count(requirement[0],-requirement[1]);
            }
         }
         day_percent_left-= ((step[2]*100) / (inventory["Energy"]/100));
         update_time_left_in_day();

         task[1][1]+=1;

         var completed = false;

         if(task[1][1] == step[3])
         {
            task[1][0] = task[1][0]+1;
            if(task[0][1].length <= task[1][0])
            {
               if(settings["do_task_complete_alert"])
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
            var new_button_text = get_desired_objective_button_text(task);
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
      if(settings["do_not_enough_time_alert"])
      {
         window.alert("You don't have enough time left to do this today.");
      }
   }

   save_to_browser();
}

function update_time()
{
   var old_season = current_season;
   switch(true)
   {
      case current_day <= season_splits[0]:
         current_season_index = 0;
         break;
      case current_day <= season_splits[1]:
         current_season_index = 1;
         break;
      case current_day <= season_splits[2]:
         current_season_index = 2;
         break;
      case current_day <= season_splits[3]:
         current_season_index = 3;
         break;
   }
   current_season = seasons[current_season_index][0];
   time_element.style.color = seasons[current_season_index][1];

   var time_string = "";
   time_string += current_season + "	 ";

   var date_without_ending = current_day-season_day_offsets[current_season_index];

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

   time_element.innerHTML = time_string;

   if(season_splits.includes(current_day) && settings["do_new_season_warning_alert"])
   {
      window.alert("Warning: Tomorrow is a new season!")
   }

   current_daily_tasks = [];
   for(var i = 0; i < max_daily_objective_count; i++)
   {
      var button = get_daily_objective_button(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }

   var objective_index_in_current_daily_tasks = 0;
   for(var objective in daily_objectives)
   {
      objective = daily_objectives[objective];

      var objective_probability = 0;
      for(var probability_contributer in objective[2])
      {
         probability_contributer = objective[2][probability_contributer];
         objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
      }

      if(Math.random() < objective_probability)
      {
         //add the task to current_daily_tasks at instance 0 of step 0
         current_daily_tasks.push([objective,[0,0],false]);

         var button = get_daily_objective_button(objective_index_in_current_daily_tasks);
         button.innerHTML = get_desired_objective_button_text([objective,[0,0],false]);
         button.className="show";
         button.parentElement.className="button-container-show";

         objective_index_in_current_daily_tasks += 1;
      }
   }

   if(old_season != current_season)
   {
      if(current_season == "Winter(Misc)")
      {
         inventory["Dying cattle"] = 0;
      }
      current_tasks = [];
      for(var i = 0; i < max_objective_count; i++)
      {
         var button = get_objective_button(i);
         button.className="hide";
         button.parentElement.className="button-container-hide";
      }

      var objective_index_in_current_tasks = 0;
      for(var objective in seasonal_objectives[current_season_index])
      {
         objective = seasonal_objectives[current_season_index][objective];

         var objective_probability = 0;
         for(var probability_contributer in objective[2])
         {
            probability_contributer = objective[2][probability_contributer];
            objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
         }

         if(Math.random() < objective_probability)
         {
            //add the task to current_tasks at instance 0 of step 0
            current_tasks.push([objective,[0,0],false]);

            var button = get_objective_button(objective_index_in_current_tasks);
            button.innerHTML = get_desired_objective_button_text([objective,[0,0],false]);
            button.className="show";
            button.parentElement.className="button-container-show";

            objective_index_in_current_tasks += 1;
         }
      }

      for(var objective in year_round_objectives)
      {
         objective = year_round_objectives[objective];

         var objective_probability = 0;
         for(var probability_contributer in objective[2])
         {
            probability_contributer = objective[2][probability_contributer];
            objective_probability+=(probability_contributer[0] * inventory[probability_contributer[1]]);
         }

         if(Math.random() < objective_probability)
         {
            //add the task to current_tasks at instance 0 of step 0
            current_tasks.push([objective,[0,0],false]);

            var button = get_objective_button(objective_index_in_current_tasks);
            button.innerHTML = get_desired_objective_button_text([objective,[0,0],false]);
            button.className="show";
            button.parentElement.className="button-container-show";

            objective_index_in_current_tasks += 1;
         }
      }
   }

   if(year>=1050)
   {
      window.alert("You have somehow managed to make it through the entire Viking age. Realistically, you probably should have died a while ago. Instead, you win!!!");
   }
}

function update_tasks()
{
   for(var i = 0; i < max_objective_count; i++)
   {
      var button = get_objective_button(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }
   for(var i in current_tasks)
   {
      var task = current_tasks[i];

      var button = get_objective_button(i);
      button.innerHTML = get_desired_objective_button_text(task);
      button.className="show";
      button.parentElement.className="button-container-show";
   }

   for(var i = 0; i < max_daily_objective_count; i++)
   {
      var button = get_daily_objective_button(i);
      button.className="hide";
      button.parentElement.className="button-container-hide";
   }
   for(var i in current_daily_tasks)
   {
      var task = current_daily_tasks[i];

      var button = get_daily_objective_button(i);
      button.innerHTML = get_desired_objective_button_text(task);
      button.className="show";
      button.parentElement.className="button-container-show";
   }
}

function update_time_left_in_day()
{
   day_percent_left_element.innerHTML = float_to_rounded_tenths_string(day_percent_left) + "% of day left";
}

function update_settings() 
{
   var initial_settings = settings;
   for(var setting in initial_settings)
   {
      console.log(setting);
      document.getElementById(setting).checked = initial_settings[setting];
   }
   settings = initial_settings;
}

function get_objective_button(button_num)
{
   return document.getElementById("objective-" + button_num + "-button");
}

function get_daily_objective_button(button_num)
{
   return document.getElementById("daily-objective-" + button_num + "-button");
}

function get_desired_objective_button_text(task) 
{
   var step = task[0][1][task[1][0]];
   var text_to_display = ""

   text_to_display += step[0] + ": -" + step[2] + " days";

   for(requirement in step[4])
   {
      requirement = step[4][requirement];
      if(requirement[1]>0)
      {
         text_to_display += ", -" + requirement[0] + " x" + float_to_rounded_tenths_string(requirement[1]);
      }
      else
      {
         text_to_display += ", requires " + requirement[0] + " x" + float_to_rounded_tenths_string(-requirement[1]);
      }
   }

   if(step[3] > 0)
   {
      text_to_display += " (" + task[1][1] + "/" + step[3] + ")";
   }
   else
   {
      text_to_display += " (" + task[1][1] + "/unlimited)";
   }

   return text_to_display;
}