import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { AgGridColumn, AgGridReact } from "ag-grid-react";
import {
	FormControl,
	RadioGroup,
	Radio,
	FormControlLabel,
	FormGroup,
	Checkbox,
} from "@mui/material";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";

function App() {
	const [value, setValue] = useState("entireDb");
	const handleRadioChange = (e) => {
		setValue(e.target.value);
	};
	return (
		<div
			className="App"
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
			}}
		>
			<div>
				<h3>Cisco group one project</h3>
				<FormControl component="fieldset">
					<RadioGroup
						row
						aria-label="gender"
						name="row-radio-buttons-group"
						value={value}
						onChange={handleRadioChange}
					>
						<FormControlLabel
							value="entireDb"
							control={<Radio />}
							label="Show entire db"
						/>
						<FormControlLabel
							value="singleFile"
							control={<Radio />}
							label="Parse single file"
						/>
					</RadioGroup>
				</FormControl>
			</div>
			<div
				style={{
					flex: 1,
				}}
			>
				{value == "singleFile" ? <SingleFile /> : <EntireDb />}
			</div>
		</div>
	);
}

function Table({ inputFileFlows }) {
	const [gridApi, setGridApi] = useState(null);
	const [selectedRow, setSelectedRow] = useState(null);
	const [shownFields, setShownFields] = useState(importantColumns);
	const [allFields, setAllFields] = useState(
		Object.keys((inputFileFlows && inputFileFlows[0]) || [])
	);
	const onGridReady = (params) => {
		setGridApi(params.api);
	};

	const onSelectionChanged = () => {
		const selectedRows = gridApi.getSelectedRows();
		if (selectedRows && selectedRows[0]) {
			setSelectedRow(selectedRows[0]);
		}
	};

	return (
		<div style={{ display: "flex", height: "100%" }}>
			<div
				style={{
					position: "relative",
					flex: 2,
				}}
			>
				{inputFileFlows && (
					<div
						className="ag-theme-alpine"
						style={{ height: "100%", width: "100%" }}
					>
						<AgGridReact
							rowData={inputFileFlows}
							rowSelection={"single"}
							onSelectionChanged={onSelectionChanged}
							onGridReady={onGridReady}
						>
							{shownFields.map((key) => (
								<AgGridColumn
									key={key}
									field={key}
									sortable={true}
									filter={true}
								></AgGridColumn>
							))}
						</AgGridReact>
					</div>
				)}
				{selectedRow && (
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "500px",
							bottom: 0,
							left: 0,
							zIndex: 5,
							background: "white",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								position: "relative",
								background: "lightgrey",
							}}
						>
							<p>Details</p>
							<button
								style={{
									position: "absolute",
									right: "30px",
									top: "30%",
								}}
								onClick={() => setSelectedRow(null)}
							>
								Close
							</button>
						</div>
						<div
							style={{
								display: "flex",
								overflowY: "auto",
								height: "100%",
							}}
						>
							<table>
								<tbody>
									{Object.keys(selectedRow).map((key) => (
										<tr key={key}>
											<td>{key}</td>
											<td>{selectedRow[key]}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
			<div
				style={{
					width: "320px",
					overflowY: "auto",
					maxHeight: "750px",
				}}
			>
				<h3>Fields</h3>
				<FormGroup>
					{Object.keys(
						(inputFileFlows && inputFileFlows[0]) || []
					).map((field) => (
						<FormControlLabel
							control={<Checkbox />}
							checked={shownFields.includes(field)}
							onChange={() => {
								if (shownFields.includes(field)) {
									setShownFields(
										shownFields.filter((e) => e !== field)
									);
								} else {
									let tempShownFields =
										Array.from(shownFields);
									tempShownFields.push(field);
									console.log(tempShownFields);
									setShownFields(tempShownFields);
								}
							}}
							label={field}
							key={field}
						/>
					))}
				</FormGroup>
				<ul></ul>
			</div>
		</div>
	);
}

function parseIp(decIp) {
	const hexIp = parseInt(decIp).toString(16).padStart(8, "0");
	const ip =
		parseInt(hexIp.slice(0, 2), 16) +
		"." +
		parseInt(hexIp.slice(2, 4), 16) +
		"." +
		parseInt(hexIp.slice(4, 6), 16) +
		"." +
		parseInt(hexIp.slice(6, 8), 16);

	return ip;
}

function parseFlowsIps(flows, fields) {
	flows.map((flow) => {
		fields.forEach((field) => {
			flow[field] = parseIp(flow[field]);
		});
		return flow;
	});
	return flows;
}

function EntireDb() {
	const [inputFileFlows, setInputFileFlows] = useState();

	useEffect(() => {
		axios.get("http://localhost:5000/get-all-flows").then((response) => {
			let flows = response.data;
			flows = parseFlowsIps(flows, ["src_ip", "dst_ip"]);
			setInputFileFlows(response.data);
		});
		return () => {};
	}, []);

	return (
		<div
			style={{
				height: "97%",
				position: "relative",
			}}
		>
			<button
				onClick={() => {
					axios
						.get("http://localhost:5000/delete-all-flows")
						.then((response) => {
							console.log(response.data);
						});
				}}
			>
				Clear db
			</button>
			{inputFileFlows && <Table inputFileFlows={inputFileFlows} />}
		</div>
	);
}

function SingleFile() {
	const [inputFile, setInputFile] = useState(null);
	const [inputFileFlows, setInputFileFlows] = useState();

	const submitFile = (addToDb) => {
		if (!inputFile) {
			alert("Upload a file first");
			return;
		}
		const formData = new FormData();
		formData.append("file", inputFile, inputFile.name);
		const queryParams = addToDb ? "?addToDb=1" : "";
		axios
			.post("http://localhost:5000/parse-file" + queryParams, formData)
			.then((response) => {
				let flows = response.data;
				flows = parseFlowsIps(flows, ["src_ip", "dst_ip"]);
				setInputFileFlows(flows);
			})
			.catch((error) => {
				console.error(error.response);
			});
	};

	return (
		<div style={{ height: "100%" }}>
			<input
				type="file"
				accept="*/pcap"
				onChange={(event) => {
					setInputFile(event.target.files[0]);
				}}
			/>
			<button onClick={() => submitFile()}>Submit</button>
			{inputFileFlows?.[0] && (
				<button onClick={() => submitFile(true)}>
					Add to database
				</button>
			)}
			{inputFileFlows && <Table inputFileFlows={inputFileFlows} />}
		</div>
	);
}

export default App;

const importantColumns = [
	"ack",
	"analytics_vld",
	"buffer_drop",
	// "_id",
	"src_ip",
	"dst_ip",
	// "protocol",
];
