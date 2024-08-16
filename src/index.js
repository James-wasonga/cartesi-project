
// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function hex2str(hex){
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

function str2hex(payload){
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

function calculate(expression){
  try{
    //evaluating the mathematical expression
    const result = eval(expression);
    return result.toString();

  }catch(e){
    return "Error in Calculation"

  }
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const metadata = data["metadata"];
  const sender = metadata["msg_sender"];
  const payload = data["payload"];


  let expression = hex2str(payload);
  console.log("Recieved Expression " + expression);

  let result;
  if(expression){
    result = calculate(expression);
  } else{         
    result = "Invalid Expression";
  }

  //sending the result back as a notice
  const notice_req = await fetch(rollup_server + "/notice",{
    method: "POST",
    headers: {
      "Content-Type":"application/json",
    },
    body: JSON.stringify({payload: str2hex(result)})
  });

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = hex2str(payload);
  
  let responseObject;
  if(route == "lastResult"){
    responseObject = JSON.stringify({lastResult: lastResult })
  } else{
    responseObject = "route not implemented";
  }

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({payload: str2hex(responseObject)}),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
