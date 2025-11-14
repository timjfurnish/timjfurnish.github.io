const s_puzzles = {}
const s_tags = {}
const g_regex = /&[^;]+;|[^a-z\.0-9]+/gi
const s_solved = {Frosty:true}

var s_lowestDifficulty = 1000
var s_highestDifficulty = 0

function AddTag(myID, tag)
{
	if (tag in s_tags)
	{
		s_tags[tag].push(myID)
	}
	else
	{
		s_tags[tag] = [myID]
	}
}

function AddPuzzle(name, w, h, data, tags, complexity)
{
	const myID = name.replaceAll(g_regex, '')
	const tagsArray = tags.split('|')

	complexity = Math.sqrt(complexity)
	s_puzzles[myID] = {name:name, width:w, height:h, data:data, tags:tagsArray, complexity:complexity}
	tagsArray.forEach(tag => AddTag(myID, tag))
	
	s_lowestDifficulty = Math.min(s_lowestDifficulty, complexity)
	s_highestDifficulty = Math.max(s_highestDifficulty, complexity)
}

AddPuzzle("Sweet", 10, 12, "BI4cvhAWEPefNAknbFoNA5f", "Object", 41)
AddPuzzle("Cheese Me", 10, 12, "BI.GiRfEJ0o7WhmbUTRRQEx", "Animal", 78)
AddPuzzle("Oh The Drama", 25, 15, "BfAheS9rpnpQbQpl6pLoxwr0G65p6k2zY0drYvgNNIPoybCRVtEguV1_Q8uowxfEox", "Object", 245)
AddPuzzle("Tinselitis", 9, 11, "tHctRFjM2j.d9aGIf2Ff", "Xmas", 37)
AddPuzzle("Frosty", 9, 12, "8HQFcdlEWJeKz1MP_e1qi", "Xmas", 53)
AddPuzzle("Alas", 13, 17, "nOkM_w8IxAiE3pY3fW..P.8tNB_XMY3zJY37HxB3", "Object", 88)
AddPuzzle("Meow Do You Do", 13, 9, "AOBZjJVsi4z.RzM.fdoV_FD", "Animal", 46)
AddPuzzle("You Big Phoney", 12, 10, "BMq6N.7IBvVIvNR.1BtDfzv", "Object", 64)
AddPuzzle("Loved Up", 13, 11, "ZObTH5.5YvqS1bD6uQU8mUh3.77", "Abstract", 54)
AddPuzzle("The King", 25, 15, "BfA5b7vpJTnwUVrCgRNaLXOo02uDwX7E5I.z0KLAhjaSlb5pZ9tVuOuf6MBFgVmLDY", "Animal", 162)
AddPuzzle("Sticky", 5, 11, "AAqEAv0_RieG", "Tutorial", 31)
AddPuzzle("Lens Me Your Ears", 13, 6, "YOLDTpQ8pQcyuc47", "Object", 83)
AddPuzzle("Super Soaker", 17, 20, "dV89NSc.Ov_gf1B..5J37P.7.Pv_wP6kjy2AzAaByiV..x.j4y9YkptBD.HP", "Animal", 98)
AddPuzzle("How Very PC", 20, 17, "dZLZ.6u0HiWcd5UxL1L00ZUL23awRpXv_h.65MAC3.Ah8Kqv257km39OD.nI", "Object", 89)
AddPuzzle("Deep In Thought", 20, 19, "GZFfge.gm8sVNQtuR8HPs0Bbf.wR_Zbx8kGPi_CegBE6IJq2F5NyC.24L6egfaH6K3", "Abstract", 111)
AddPuzzle("Downward", 20, 19, "GZGh.DGx65L66pnbTMzy3tI8pNb4MACo9KI.SFL9IFj2pL2dsL_aLnGq_Zh08YZSeV", "Abstract", 305)
AddPuzzle("Meep Morp Zeep", 15, 23, "iRilLmKZsQ7qUM_zqU8QxLvAQ_7LZg3SoKZr.0yRAZRi33.3O597OMXDnCgu", "Object", 115)
AddPuzzle("High Three", 12, 10, "BMqL3hegqftFlmhQfBdhcg5", "Animal", 65)

function FormatPuzzleNameAndSize(name, width, height)
{
	return name + "<BR><SMALL><SMALL>" + width + " x " + height + "</SMALL></SMALL>"
}

function ByComplexity(a, b)
{
	return s_puzzles[a].complexity - s_puzzles[b].complexity
}

function BuildButtonsForPuzzles(pageName)
{
	const output = []

	for (var id of Object.keys(s_puzzles).sort(ByComplexity))
	{
		const puzzle = s_puzzles[id]
		const tagsHTML = []
		puzzle.tags.forEach(tag => tagsHTML.push("<NOBR class=tag>" + tag + "</NOBR>"))
		const complexityFraction = ((puzzle.complexity - s_lowestDifficulty) / (s_highestDifficulty - s_lowestDifficulty))
		const red = Math.sqrt(complexityFraction)
		const green = 1 - complexityFraction
		const scaleCol = (id in s_solved) ? 90 : 127
		const col = "rgb(" + Math.floor(scaleCol + scaleCol * Math.sqrt(red)) + ", " + Math.floor(scaleCol + scaleCol * Math.sqrt(green)) + ", " + scaleCol + ")"
		output.push('<BUTTON CLASS="puzzleButton" STYLE="background-color: ' + col + '" onClick="SetHash(\'' + pageName + '\', \'' + id + '\')"><DIV class=buttonPuzzleName>' + FormatPuzzleNameAndSize(puzzle.name, puzzle.width, puzzle.height) + '</DIV><DIV STYLE="padding:5px">' + tagsHTML.join(" ") + '</DIV></BUTTON>')
	}
	
	return output.join('<wbr>')
}
