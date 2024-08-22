//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

function Smoother(arr)
{
	var total = 0

	const len = arr.length
	const midIndex = (len + 1) / 2
	const div = midIndex * midIndex

	for (var t in arr)
	{
		const frac = (+t + 1) * (len - t) / (div)
		total += arr[t] * frac * frac
	}

	return total
}

function DrawSmoothedGraph(graphData, smoothingCount)
{
	const {colours, data} = graphData

	// WORK OUT WHAT TO DRAW
	const colourEntries = Object.keys(colours)
	const drawData = {}

	var biggestVal = 0

	for (var spelling of colourEntries)
	{
		drawData[spelling] = {smoothing:[0], drawThis:[]}

		for (var i = 0; i < smoothingCount; ++ i)
		{
			drawData[spelling].smoothing.push(0, 0)
		}
	}
	
	for (var t of data)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			drawData[spelling].smoothing.push(t[spelling] ?? 0)				
			drawData[spelling].smoothing.shift()

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
		}
		
		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	for (var i = 0; i < smoothingCount * 2; ++ i)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			drawData[spelling].smoothing.push(0)
			drawData[spelling].smoothing.shift()

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
		}
		
		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	colourEntries.reverse()

	// DONE GATHERING DATA
	
	const canvas = document.getElementById("graphCanvas")
	const drawToHere = canvas?.getContext("2d")
	
	if (drawToHere)
	{
		drawToHere.fillStyle = "#444444"
		drawToHere.fillRect(0, 0, canvas.width, canvas.height)
		
		for (var spelling of colourEntries)
		{
			const {drawThis} = drawData[spelling]

			// Remove the first smoothingCount entries and the last smoothingCount entries so that we end up the same size as the data passed in
			drawThis.splice(0, smoothingCount)
			drawThis.splice(-smoothingCount)

			var numDone = 0
			const scaleX = canvas.width / (drawThis.length + 1)
			const scaleY = canvas.height * 0.95 / biggestVal

			drawToHere.fillStyle = colours[spelling]
			drawToHere.beginPath()
			drawToHere.moveTo(0, canvas.height)
		
			for (var t of drawThis)
			{
				++ numDone
				drawToHere.lineTo(numDone * scaleX, canvas.height - t * scaleY)
			}

			drawToHere.lineTo(canvas.width, canvas.height)
			drawToHere.fill()

//			console.log(spelling + ": Input=" + data.length + " Drew=" + drawThis.length + " Difference=" + (drawThis.length - data.length))
		}
	}	
}

function CalcGraphCanvasWidth()
{
	return Math.max(window.innerWidth - 125, 870)
}

window.addEventListener('resize', function(theEvent)
{
	const elem = document.getElementById("graphCanvas")
	
	if (elem)
	{
		elem.width = CalcGraphCanvasWidth()
		TabRedrawGraph()
	}
}, true);
