import "./App.css";
import { useState } from "react";
import axios from "axios";

function App() {
	const [inputFile, setInputFile] = useState(null);

	const submitFile = () => {
		if (!inputFile) {
			alert("Upload a file first");
			return;
		}
		const formData = new FormData();
		formData.append("file", inputFile, inputFile.name);
		axios
			.post("http://localhost:5000/parse-file", formData)
			.then((response) => {
				console.log(response.data);
			})
			.catch((error) => {
				console.error(error.response);
			});
	};
	return (
		<div className="App">
			<div>Cisco group one project</div>
			<input
				type="file"
				accept="*/pcap"
				onChange={(event) => {
					setInputFile(event.target.files[0]);
				}}
			/>
			<button onClick={() => submitFile()}>Submit</button>
		</div>
	);
}

export default App;
