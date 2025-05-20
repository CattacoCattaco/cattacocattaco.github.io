const file_input = document.getElementById("file-input");

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

function saveAllDataToFile()
{
  //Data to be stored in save file
  var data = "";

  for(var i = 0; i < localStorage.length; i++)
  {
    var key = localStorage.key(i)

    data += `${key}=${localStorage.getItem(key)}\n`
  }

  data.trimEnd();

  // Write data in 'CattacoCattaco_github_io_save.txt'
  downloadToFile(data, 'CattacoCattaco_github_io_save.txt', 'text/plain')
}

function loadAllDataFromFile(postLoadFunc)
{
  if (!selectedFile) return;

  const reader = new FileReader()
  reader.onload = (e) => {
    // e.target points to the reader
    const textContent = e.target.result
    var data = textContent.split("\n");

    for(var entry in data)
    {
      entry = data[entry].split("=");

      for(var i = 2; i < entry.length; i++)
      {
        entry[1] += entry[i];
      }

      localStorage.setItem(entry[0], entry[1]);
    }

    postLoadFunc.apply();
  }

  reader.onerror = (e) => {
    const error = e.target.error
    console.error(`Error occured while reading ${file.name}`, error)
  }

  reader.readAsText(selectedFile);
}