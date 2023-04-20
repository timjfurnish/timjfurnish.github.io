document.write(WTTag('div onClick="WTCloseVerbCoin()" id="vcModal" style="display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto"|div class="modal-content"', WTTag('span id="vcElem" style="position: fixed; ' + WTBuildBubble(s_wtSettings.panelGradient, '#555577', 15, 10) + '"', 'Some text')))

let verbCoinModal = document.getElementById("vcModal");
let verbCoinElem = document.getElementById("vcElem");

s_resizeElements.push("vcModal")

function WTOpenVerbCoin(x, y, id, verbs)
{
	let contents = new Array()

	for (verb in verbs)
	{
		contents.push("<A HREF=\"javascript:WTVerbCoinClick('" + id + "', '" + verb + "')\" style=\"" + s_wtSettings.panelTabStyleOn + "; text-decoration: none\">&nbsp;" + verbs[verb] + "&nbsp;</A>")
	}
	
	verbCoinElem.innerHTML = WTTag('b|big|center', contents.join('<br>'))

	const width = window.innerWidth
	const height = window.innerHeight

	if (x < 0.5 * width)
	{
		verbCoinElem.style.left = x
		verbCoinElem.style.right = ""
	}
	else
	{
		verbCoinElem.style.left = ""
		verbCoinElem.style.right = width - x
	}

	if (y < 0.5 * height)
	{
		verbCoinElem.style.top = y
		verbCoinElem.style.bottom = ""
	}
	else
	{
		verbCoinElem.style.top = ""
		verbCoinElem.style.bottom = height - y
	}

	verbCoinModal.style.display = "block";
}

function WTVerbCoinClick(id, verb)
{
	WTCloseVerbCoin()
	WTClick(id, verb)
}

function WTCloseVerbCoin()
{
	verbCoinModal.style.display = "none";
}
