#! /usr/bin/env node

//////////////////////////
// Import Dependencies //
////////////////////////

const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const figlet = require("figlet");
const { Configuration, OpenAIApi } = require("openai");

/////////////////////////
// Main Functionality //
///////////////////////

// Run the main function
main( );
async function main ( ) {

  // Create a new program
  const program = new Command( );

  // Print the banner
  console.log(figlet.textSync("Bimbus AI"));

  // Define the details
  program
    // Program Details
    .version("1.0.0")
    .description("An example CLI for managing a directory")
    // Bimbus AI Functions
    .option("-t --token [value]", "Open AI Access Token")
    .option("-i --input [value]", "Input File")
    .option("-o --output [value]", "Output Directory")
    .option("-f --filetype [value]", "Output File Type")
    .option("-v --verbose", "Verbose Output")
    // Final processing
    .parse(process.argv);

  // Fetch the options
  const options = program.opts( );

  // If the -h flag is specified, print the help and exit
  if (options.help) {
    errorAndExit("");
  }

  // If the token is not specified, show an error and print the help
  if (!options.token) {
    errorAndExit("Error: Please specify an Open AI token using -t\n");
  }

  // If the input file is not specified, show an error and print the help
  if (!options.input) {
    errorAndExit("Error: Please specify an input file using -i");
  }

  // If outputType is specified, ensure it is valid
  // Valid values are markdown, html and txt
  if (options.filetype) {
    if (options.filetype !== "markdown" && options.filetype !== "html" && options.filetype !== "text") {
      errorAndExit("Error: Invalid output type specified");
    }
  }

  // Fetch the input vars
  const openAIToken = options.token;
  const inputFile = options.input;
  const outputDir = options.output ? options.output : __dirname;

  // If no output type is specified, default to markdown
  const outputType = options.filetype ? options.filetype : "markdown";

  // Info output
  console.log("Running Bimbus AI..\n");

  // If verbose is specified, print the details
  if (options.verbose) {

    // Print the details
    console.log("Open AI Token: ", openAIToken);
    console.log("Input File: ", inputFile);
    console.log("Output Directory: ", outputDir, "\n");

  }

  // Ensure the input file exists
  if ( !fs.existsSync(inputFile) ) {
    errorAndExit("Error: Input file does not exist");
  }

  // Ensure the input file is a file and not a directory
  if ( !fs.lstatSync(inputFile).isFile( ) ) {
    errorAndExit("Error: Input file is not a file");
  }

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    errorAndExit("Error: Output directory does not exist");
  }

  // Ensure the output directory is a directory and not a file
  if ( !fs.lstatSync(outputDir).isDirectory( ) ) {
    errorAndExit("Error: Output directory is not a directory");
  }

  // Info output
  console.log("Generating Documentation..\n");

  // Fetch the contents of the input file
  const input = fs.readFileSync(inputFile, "utf8");

  // Fetch the base name for the input file
  const inputBaseName = path.basename(inputFile);

  // Generate a series of prompts to send to the Open AI API
  const prompts : { [ id : string ] : string } = {
      "Summary" : "You will be provided code from the file '"+inputBaseName+"'. Provide a high level summary on what you believe the purpose of the code is. Use a confident tone and respond in a single sentence.\n"+input+"\n",
      // "Details" : "You will be provided code from the file '"+inputBaseName+"'. Provide a high level summary on what you believe the purpose of the code is. Use a confident tone and respond in a single paragraph.\n"+input+"\n",
      "Technical Summary" : "You will be provided code from the file '"+inputBaseName+"'. Provide a high level summary on the functionality of the code from a technical perspective. Use a confident tone and respond in a single sentence.\n"+input+"\n",
      // "Technical Details" : "You will be provided code from the file '"+inputBaseName+"'. Provide a high level summary on the functionality of the code from a technical perspective. Use a confident tone and respond in a single paragraph.\n"+input+"\n",
  };

  // Used to hold the replies
  var replies : { [ id : string ] : string } = { };

  // Loop through the prompts and generate the responses
  for (let i1 = 0 ; i1 < Object.keys(prompts).length ; i1++ ) {
    let key = Object.keys(prompts)[i1];
    replies[key] = await openAIChatCompletions( openAIToken, prompts[key] );
  }

  // Write the output to a file
  writeOutputToFile( outputDir, outputType, replies, inputBaseName );

  // Info output
  console.log("Done!");

}

//////////////////////////////////
// Library of helper functions //
////////////////////////////////

// Function to show and exit
function errorAndExit ( message: string ) {
  console.error(message,"\n");
  console.error("Run 'bimbus -h' for help\n");
  process.exit(1);
}

// Function that calls the open AI chat completions API endpoint
async function openAIChatCompletions( token: string, prompt: string ) : Promise<string> {

  const configuration = new Configuration({
    apiKey: token,
  });
  const openai = new OpenAIApi(configuration);
  
  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: prompt}],
    temperature: 0.05,

  });

  // Fetch the reply
  const reply = chatCompletion.data.choices[0].message.content;

  // return the reply
  return reply;

}

// Function to take the output and write it to a file
function writeOutputToFile ( outputDir: string, outputType: string, output: { [ id : string ] : string }, originalFileName: string ) {

  // Replace .'s with -'s in the originalFileName
  originalFileName = originalFileName.replace(/\./g, "-");

  // Produce the final output file name
  let currentDate = new Date( ).toISOString( ).slice(0,10);
  let outputFileName = originalFileName + "--" + currentDate;

  // Create the file extension based on the output type
  let fileExtension = "";
  if (outputType === "markdown") {
    fileExtension = ".md";
  } else if (outputType === "html") {
    fileExtension = ".html";
  } else if (outputType === "text") {
    fileExtension = ".txt";
  }

  // Create the full directory path and file name, including the extension
  let fullFilePath = path.join(outputDir, outputFileName + fileExtension);

  // Create different output based on the output type and save it
  let outputText = "";
  if (outputType === "markdown") {

  } else if (outputType === "html") {

  } else if (outputType === "text") {

    // Loop through the output and add it to the outputText
    for (let i1 = 0 ; i1 < Object.keys(output).length ; i1++ ) {
      let key = Object.keys(output)[i1];
      outputText += key + "\n";
      outputText += output[key] + "\n\n";
    }

    // Write the output to a file
    fs.writeFileSync(fullFilePath, outputText);

  }

}

