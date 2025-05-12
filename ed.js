const TOKEN = "Bearer yourJwtTokenGetInEd"

var global_lesson = "";
var nodeid = 0;

async function GenSubmitItem(type, id, code) {
  console.log(id, code);
  var res1 = await fetch("https://eduiwebservices2.engdis.com/api/practiceManager/GetItem/" + id + "/" + code + "/23/0/6", {
    "headers": {
      "authorization": TOKEN,
    },
    "body": null,
    "method": "GET"
  })
  var output = {};
  try {
    var res = await res1.json();
    var list = res["i"]["q"];
    for (let i = 0; i < list.length; i++) {
      let obj = list[i];
      if (obj.hasOwnProperty("al") && obj["al"].length > 0) {

        output['iId'] = id;
        output['iCode'] = code;
        output['iType'] = type;
        var ua = [];
        for (var j = 0; j < obj["al"].length; j++) {
          var ans = obj["al"][j]["a"];
          var right_id = 0;
          if (ans[0].hasOwnProperty("c")) {
            var right_object = ans.filter(function (a) { return a.c == 1; });
            right_id = right_object[0]["id"];
          }
          else {
            right_id = ans[0]["id"];
          }
          ua.push({ qId: 1, aId: [[obj["al"][j]["id"], right_id]], bId: [] });
        }
        output["ua"] = ua;
        return (output);
      }
    }
  }
  catch (err) {
    console.log(id, code, " cause error", err.message)
  }
}

async function SubmitTest(nodeid, test_id, submit_content) {
  var res = await fetch("https://edwebservices2.engdis.com/api/UserTestV1/SaveUserTest/"+nodeid+"/" + test_id + "/true", {
    "headers": {
      "content-type": "application/json; charset=UTF-8",
      "authorization": TOKEN,
    },
    "body": submit_content,
    "method": "POST"
  });
  var js = await res.json();
  return js["finalMark"];
}

async function GetItem(id, code) {
  console.log(id, code);
  var res1 = await fetch("https://eduiwebservices2.engdis.com/api/practiceManager/GetItem/" + id + "/" + code + "/23/0/6", {
    "headers": {
      "authorization": TOKEN,
    },
    "body": null,
    "method": "GET"
  })
  var res = await res1.json();
  try {
    var list = res["i"]["q"];
    for (let i = 0; i < list.length; i++) {
      let obj = list[i];
      if (obj.hasOwnProperty("al") && obj["al"].length > 0) {
        for (var j = 0; j < obj["al"].length; j++) {
          console.log(obj["al"][j]["a"]);
        }
      }
    }
  }
  catch (err) {
    console.log(id, code, " cause error", err.message)
  }
}

async function SetProgressPerTask(course_id, task_id) {
  var r = await fetch("https://edwebservices2.engdis.com/api/Progress/SetProgressPerTask", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "authorization": TOKEN,
      "content-type": "application/json",
    },
    "body": "{\"CourseId\":" + course_id + ",\"ItemId\":" + task_id + "}",
    "method": "POST"
  });
  if (r.status == 429) {
    console.log("429 detected, retrying...");
    await new Promise(r => setTimeout(r, 2000));
    var r = await fetch("https://edwebservices2.engdis.com/api/Progress/SetProgressPerTask", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "authorization": TOKEN,
        "content-type": "application/json",
      },
      "body": "{\"CourseId\":" + course_id + ",\"ItemId\":" + task_id + "}",
      "method": "POST"
    });
  }
}

function correct_number(num) {
  if (num < 10)
    return "0" + num;
  return num;
}

async function LoadScript(scriptname) {
  var r = await fetch("https://ed21.engdis.com//Runtime/Lessons/" + scriptname);
  eval(await r.text());
  global_lesson = lesson;
}

async function GetUserNodeProgress(id) {
  var js = await fetch("https://eduiwebservices2.engdis.com/api/CourseTree/GetUserNodeProgress/45689", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "authorization": TOKEN,
      "content-type": "application/json"
    },
    "body": "[{\"ParticleId\":319,\"NodeType\":3,\"LockedNodes\":[],\"particleHasProgress\":true,\"lowestNodeType\":5}]",
    "method": "POST"
  });
  var res = await js.json();

  return

}

async function Exec(cid, lesson) {
  var test_id = lesson.id;
  console.log("Name:", lesson.name, "Step:", lesson.description, "Step:", lesson.steps.length);
  for (let i = 0; i < lesson.steps.length; i++) {
    var step = lesson.steps[i];
    console.log("Doing step:", step.id, ", name:", step.Name);
    var { tasks, Name } = step;
    if (Name === "Explore" || Name.includes("Practice") || step.id == 1 || step.id == 2) {
      for (var a = 0; a < tasks.length; a++) {
        var task = tasks[a];
        var { id, code } = task;
        console.log("Doing task:", id);
        await SetProgressPerTask(cid, id);
      }
    }
    // if (Name.includes("Test") || Name.includes("450")) {
    //   var obj = {};
    //   obj["t"] = 32000;
    //   var arrr = [];
    //   for (var a = 0; a < tasks.length; a++) {
    //     var task = tasks[a];
    //     var { id, code, type } = task;
    //     arrr.push(await GenSubmitItem(type, id, code));
    //   }
    //   obj["a"] = arrr;
    //   var str = JSON.stringify(obj);
    //   console.log(await SubmitTest(nodeid, test_id, str));
    // }
    if (Name.includes("450")) {
      for (var a = 0; a < tasks.length; a++) {
        var task = tasks[a];
        var { id, code } = task;
        await GetItem(id, code);
      }
    }
  }
}

async function GetCourseProgress(id) {
  var res1 = await fetch("https://edwebservices2.engdis.com/api/CourseTree/GetCourseProgress/" + id, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "authorization": TOKEN,
    },
    "body": null,
    "method": "GET"
  });
  var res = await res1.json();
  console.log("Course id:", res.CourseId, ":", res.CourseProgressTree.Name);
  var child = res.CourseProgressTree.Children;
  for (let i = 0; i < child.length; i++) {
    let obj = child[i];
    nodeid = obj.NodeId;
    console.log("Unit:", obj.Metadata.BaseUnitId, "name:", obj.Name, "isdone:", obj.IsDone);
    if (!obj.IsDone) {
      var children = obj.Children;
      for (let l = 0; l < children.length; l++) {
        let c = children[l];
        if (!c.IsDone) {
          console.log("Lesson:", c.Name, ":", c.Metadata.Code);
          await LoadScript(c.Metadata.Code + ".js");
          await Exec(id, global_lesson);
        }
      }
    }

  }
}

async function main() {
  // await GetCourseProgress(45742);
  // return;
  await LoadScript("a3roak.js");
  await Exec(989024886, global_lesson);
  //await GetItem(989024847, "a2loajt101");
  return;
  for (let i = 1; i <= 15; i++) {
    await GetItem(26493 + i - 1, "a2racbt0" + correct_number(i));
  }
}

main();