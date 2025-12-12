const s_puzzles = {}
const s_tags = {}
const g_regex = /&[^;]+;|[^a-z\.0-9]+/gi
const s_solved = {}

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

	s_puzzles[myID] = {name:name, width:w, height:h, data:data, tags:tagsArray, complexity:complexity}
	tagsArray.forEach(tag => AddTag(myID, tag))
	
	s_lowestDifficulty = Math.min(s_lowestDifficulty, complexity)
	s_highestDifficulty = Math.max(s_highestDifficulty, complexity)
}

AddPuzzle("Sticky", 5, 11, "AAqEAv0_RieG", "Tutorial|Character", 23)
AddPuzzle("Sweet", 10, 12, "BI4cvhAWEPefNAknbFoNA5f", "Object", 25)
AddPuzzle("Warning", 14, 13, "BPMcaVXDeGrBYTIoKb.mvbt__.fHX5EA.A", "Abstract", 25)
AddPuzzle("Tinselitis", 9, 11, "tHctRFjM2j.d9aGIf2Ff", "Xmas", 27)
AddPuzzle("Meow Do You Do", 13, 9, "AOBZjJVsi4z.RzM.fdoV_FD", "Animal", 38)
AddPuzzle("You Big Phoney", 12, 10, "BMq6N.7IBvVIvNR.1BtDfzv", "Object", 47)
AddPuzzle("Frosty", 9, 12, "8HQFcdlEWJeKz1MP_e1qi", "Xmas|Character", 48)
AddPuzzle("Academic", 21, 15, "Fa3XnXvQI501W_uEQ7O8zV83D..0ketnHXve_13.7ve_13.7va49rHf.", "Object", 113)
AddPuzzle("High Three", 12, 10, "BMqL3hegqftFlmhQfBdhcg5", "Abstract|Animal", 58)
AddPuzzle("Out Of Space", 22, 16, "qb3r3zLPvPvPjL2CPvABMs13IDE5.PQnMZznPf.225..zn.2zz7jvMyDHz2xgg", "Abstract", 59)
AddPuzzle("What Say You?", 13, 13, "0OTc_ffJSHpjM5GbFPenJDQkNJFa_0S", "Abstract", 60)
AddPuzzle("Loved Up", 13, 11, "ZObTH5.5YvqS1bD6uQU8mUh3.77", "Abstract", 60)
AddPuzzle("Lochdown", 22, 8, "3bQR..4id3oAhD3DGOs4HOTQNCl87R0Ti", "Animal", 62)
AddPuzzle("Lens Me Your Ears", 13, 6, "YOLDTpQ8pQcyuc47", "Object", 76)
AddPuzzle("Quavering", 11, 9, "tKXgETe6xufEoDI_xS8M", "Abstract", 76)
AddPuzzle("How Very PC", 20, 17, "dZLZ.6u0HiWcd5UxL1L00ZUL23awRpXv_h.65MAC3.Ah8Kqv257km39OD.nI", "Object", 83)
AddPuzzle("Cheese Me", 10, 12, "BI.GiRfEJ0o7WhmbUTRRQEx", "Animal", 84)
AddPuzzle("Getting Jiggy", 24, 24, "LejDbb..n.nuib6FD.PjL.Ouib577.nPDb_Ns_7RijOrsmXP2C..2C.zcGXRijOrkuWvDb..n.nuib6FD.PjL.Ouib577.nPDb.", "Abstract", 84)
AddPuzzle("Shelly", 20, 9, "_YFf6YZsWmVsoTxMJM0LJUHrEzmYi1l.2", "Animal", 87)
AddPuzzle("Alas", 13, 17, "nOkM_w8IxAiE3pY3fW..P.8tNB_XMY3zJY37HxB3", "Object|Halloween|Character", 90)
AddPuzzle("The Grape Escape", 17, 20, "dV8Ma9kwByWMb8vf2L7J..7vfvf.2BDkPYu.g..A._AzG1njGyBA2BE6BEIR", "Object", 102)
AddPuzzle("Super Soaker", 17, 20, "dV89NSc.Ov_gf1B..5J37P.7.Pv_wP6kjy2AzAaByiV..x.j4y9YkptBD.HP", "Animal", 103)
AddPuzzle("Fangs Very Much", 13, 16, "aOrE6G_G9ERq.zjAq6ld59vf3v6kRk6kCGUE_x", "Halloween|Character", 110)
AddPuzzle("WooOOooOOoo", 20, 20, "ZZ1m2D_.wPG8BxeOY5wa9dsnXPQegBgkpTnPf..77uYnfqGxmRc4rAh2opcG7oh4yXAOvg", "Halloween|Character", 117)
AddPuzzle("Meep Morp Zeep", 15, 23, "iRilLmKZsQ7qUM_zqU8QxLvAQ_7LZg3SoKZr.0yRAZRi33.3O597OMXDnCgu", "Object|Character", 118)
AddPuzzle("Hanging Around", 22, 20, "Cbv20B.5N7zHje6Yx6yvmIfohGBCxA5AE50OvnQ3sJe1wjYmFXdBC172qK894skmLzRf2A.7H..f", "Animal|Halloween", 119)
AddPuzzle("Grab Bag", 13, 15, "NOspxoG04H..B239_TJXgnuiBIMsmixDH8Gs", "Object", 130)
AddPuzzle("Deep In Thought", 20, 19, "GZFfge.gm8sVNQtuR8HPs0Bbf.wR_Zbx8kGPi_CegBE6IJq2F5NyC.24L6egfaH6K3", "Abstract", 133)
AddPuzzle("Picking Up The Pieces", 24, 18, "3eylHzLjx7x757VjlLxJx95Xvfffd3RrXvbZznMl..1j..3Dd.ZH..f1dRNjd.ZTR31nJzhLPTz", "Object", 146)
AddPuzzle("Cackle", 23, 25, "JdiBE013sbABA3ABA3ABce.2D210Pwxc_._B650Xgi3.A_._2D.__B..ANw.A9I.H7._A.fbD_AXn1Ah_TCvaNk9jwkkJqfeB65", "Halloween|Character", 147)
AddPuzzle("Not Today, Early Bird", 21, 14, "xaFhDbjHKKlLoABA613wIxjZhDE2JT5hDAoxj3DZuQuvx9PE4IOQ", "Animal", 178)
AddPuzzle("The Ruins", 20, 17, "dZNXPPf5ZwhXnm8GEt.on2A2wvwbN73bbznMMoSRTzzvtSjL862DpRBojwBj", "Object|Halloween", 186)
AddPuzzle("The King", 25, 15, "BfA5b7vpJTnwUVrCgRNaLXOo02uDwX7E5I.z0KLAhjaSlb5pZ9tVuOuf6MBFgVmLDY", "Animal", 208)
AddPuzzle("Stocking Filler", 11, 20, "lLsHC46Eisx8OReupw.gjYvqKZ3f23wF4jXvRdCk", "Xmas|Character", 235)
AddPuzzle("Warp Speed", 25, 25, "2fffAcB2F6E1wPg.m7AKrF_yvPQG9BYaL.GE33FrZzEQlDIKm2zxVbTJMEFrIgQwdHksh1ZVFQ4NtI_tJUyjHSk.HTvPhbBD14jhdV3zg7P", "Object", 240)
AddPuzzle("Do You Smell Carrots?", 17, 20, "dV8OsJXXDfbDmSAFw4Lw2RARtG09sfQtwAH_Itc_Kx7674VSMDG9pN_WxDX.", "Xmas|Character", 295)
AddPuzzle("Broom With A View", 24, 25, "jehB.DHOuNb0UBDIvABC4BDA7wxn9BDGxPSjb2MtUOHHQc2KafAfuvou7pOKr65zY2136M13I65wb_.2cmggyqY5LwAx.ss1haYRb_O", "Halloween|Character", 306)
AddPuzzle("Bamboozled", 19, 19, "0X8QgPOQ_fgwdghcBCAHW1CyvpPlJXqWtb7nIgHOYwS9ro6xko9t9EYxso52Pwu", "Animal", 312)
AddPuzzle("Oh The Drama", 25, 15, "BfAheS9rpnpQbQpl6pLoxwr0G65p6k2zY0drYvgNNIPoybCRVtEguV1_Q8uowxfEox", "Object", 315)
AddPuzzle("Pirhana", 20, 17, "dZLGtbvnPf.fd1jf.xwaiAXmchSNuon.gLSxyi018NAgd652_uJJCKw1ooAi", "Animal", 333)
AddPuzzle("Downward", 20, 19, "GZGh.DGx65L66pnbTMzy3tI8pNb4MACo9KI.SFL9IFj2pL2dsL_aLnGq_Zh08YZSeV", "Abstract", 398)
AddPuzzle("So Bright", 21, 25, "Yak2CnUakaolGRhSK6mj1zHMIUxc6x..jABq9YkYibHFAgxi4C2GJy9r5uQi365sfAI9yzEUgkDHLDEr08geABcfAeQ", "Animal|Xmas", 448)
AddPuzzle("Giddy", 25, 22, "xfW6whDIgxjZ1f.540pR1DnORI5zJ9rT4RLw1fwHogNj2JcglhZjZ8kZUrHXJW4rsSNVVL1tJUBrffHXrfjb.9jLP4rnmAo", "Animal", 605)

function FormatPuzzleNameAndSize(name, subtitle)
{
	return name + "<BR><SMALL><SMALL>" + subtitle + "</SMALL></SMALL>"
}

function ByComplexity(a, b)
{
	return s_puzzles[a].complexity - s_puzzles[b].complexity
}

function BuildBigButton(col, click, name, tagsHTML)
{
	const output = []
	output.push('<BUTTON CLASS="puzzleButton" STYLE="background-color: ' + col + '" onClick="' + click + '"><DIV class=buttonPuzzleName>' + name + '</DIV>')

	if (tagsHTML && tagsHTML != "")
	{
		output.push('<DIV STYLE="padding:5px">' + tagsHTML + '</DIV>')
	}

	output.push('</BUTTON>')

	return output.join('')
}

function BuildButtonsForPuzzles(pageName, set, darkIfHere)
{
	const output = []

	for (var id of Object.keys(set).sort(ByComplexity))
	{
		const puzzle = s_puzzles[id]
		const tagsHTML = []
		puzzle.tags.forEach(tag => tagsHTML.push("<NOBR CLASS=tag>" + tag + "</NOBR>"))
		const complexityFraction = ((puzzle.complexity - s_lowestDifficulty) / (s_highestDifficulty - s_lowestDifficulty))
		const red = Math.pow(complexityFraction, 0.4)
		const green = 1 - complexityFraction
		const scaleCol = (id in darkIfHere) ? 90 : 127
		const col = "rgb(" + Math.floor(scaleCol + scaleCol * Math.sqrt(red)) + ", " + Math.floor(scaleCol + scaleCol * Math.sqrt(green)) + ", " + scaleCol + ")"
		output.push(BuildBigButton(col, "SetHash('" + pageName + "', '" + id + "')", FormatPuzzleNameAndSize(puzzle.name, puzzle.width + " x " + puzzle.height), tagsHTML.join(' ')))
	}
	
	return output.join('<wbr>')
}
