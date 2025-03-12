var g_fadeMe = 0
var g_trig = {}
var g_stillGoing = true
var g_fadeInElementNames = []

function QueueFade(elementName)
{
	g_fadeInElementNames.push(elementName)
	return elementName
}

function FadeGetNextName()
{
	return QueueFade('fadeMe' + (g_fadeMe ++))
}

function StartFading()
{
	FadeStartNext()
	setTimeout(TickFade, 20)
}

function FadeStartNext()
{
	const name = g_fadeInElementNames.shift()
	if (name)
	{
		const elem = document.getElementById(name)
		const rect = elem.getBoundingClientRect()
		
		g_trig[name] = {style:elem.style, op:0}
		
		// Speed up if this element is off the top of the screen...
		const time = (-rect.y >= rect.height) ? 5 : 250		
		setTimeout(FadeStartNext, time)
	}
	else
	{
		g_stillGoing = false
	}
}

function TickFade()
{
	var didSomething = g_stillGoing

	for (var [k,v] of Object.entries(g_trig))
	{
		v.op += 0.015
		if (v.op >= 1)
		{
			v.style.opacity = 1
			delete g_trig[k]
		}
		else
		{
			v.style.opacity = v.op
			didSomething = true
		}
	}
	
	if (didSomething)
	{
		setTimeout(TickFade, 20)
	}
}
