function isInside(marker, polyPoints) {
  const x = marker[0], y = marker[1];

  let inside = false;
  for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
      const xi = polyPoints[i][0], yi = polyPoints[i][1];
      const xj = polyPoints[j][0], yj = polyPoints[j][1];

      const intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
  }

  return inside;
}

function getPoints(
  sides,
  angle = 0,
  radius = 50,
) {
  const cx = radius;
  const cy = radius;
  const angleRadians = angle * (180 / Math.PI)
  const angleIncrement = 2 * Math.PI / sides;
  
  const points = new Array(sides).fill(undefined)
    .map((_, i) => {
      return [
        cx + radius * Math.cos(angleRadians + (angleIncrement * i)),
        cy + radius * Math.sin(angleRadians + (angleIncrement * i)),
      ];
    });
  if (points.some(([x, y]) => (x >= radius && x < radius + 1)
    && (y >= 0 && y < 1))) {
      return points;
    }
  return getPoints(sides, angle + 10, radius);
}

function getPolygon(points, color, foregroundColor) {
  return `
    <polygon
      points="${points.join(' ')}"
      fill="${color}"
      stroke="${foregroundColor || ''}"
      stroke-width="0.5"
    />
  `
}

function sortPoints(l, r) {
  if (Math.atan2(l[0] - 50, l[1] - 50) > Math.atan2(r[0] - 50, r[1] - 50)) {
    return -1;
  }
  if (Math.atan2(l[0] - 50, l[1] - 50) > Math.atan2(r[0] - 50, r[1] - 50)) {
    return 1;
  }
  return 0;
}

function getElementDimensions(element) {
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = element;
  return {
    height: clientHeight < scrollHeight ? clientHeight : scrollHeight,
    width: clientWidth < scrollWidth ? clientWidth : scrollWidth,
  };
}

function renderPolygon(points, outletElement, containerElement, color) {
  outletElement.innerHTML = `
    <polygon points="${[...points].sort(sortPoints).join(' ')}" fill="${color}" />
  `;
}


function stats({
  selector,
  labels,
  pointCount,
  backgroundColor,
  foregroundColor,
  values,
  onChange,
}) {
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --foregroundColor: ${foregroundColor};
    }
  `;
  document.head.appendChild(style);

  const containerEl = document.querySelector(selector);
  containerEl.classList.add('st-container');
  const labelPoints = getPoints(labels.length);
  containerEl.innerHTML = `
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
    >
      ${getPolygon(labelPoints, 'transparent')}
    </svg>
    <svg
      class="st-figure"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
    >
      ${getPolygon(labelPoints, backgroundColor, foregroundColor)}
      ${labelPoints.reduce((result, point) => `
        ${result}
        <line
          x1="50"
          y1="50"
          x2="${point[0]}"
          y2="${point[1]}"
          stroke="${foregroundColor}"
          stroke-width=".5"
          stroke-opacity=".5"
        />
      `, '')}
    </svg>
    <svg
      class="st-controls"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      id="st-controls"
    >
    </svg>
  `;

  labelPoints.forEach(([x,y], i) => {
    const span = document.createElement('span');
    span.classList.add('st-label');
    span.setAttribute('style', `left: ${x}%; top: ${y}%;`);
    span.innerText = labels[i];
    containerEl.appendChild(span);
  });

  const controlPoints = new Array();
  new Array(pointCount).fill(undefined)
    .forEach((_, i) => {
      const id = `control-${i}`;
      const div = document.createElement('div');
      div.classList.add('st-control');
      div.setAttribute('draggable', 'true');
      div.setAttribute('id', id);
      div.addEventListener('dragstart', (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData('id',id);
      });
      containerEl.appendChild(div);
      const { height: containerHeight, width: containerWidth } = getElementDimensions(containerEl);
      const x = values?.[i]
        ? values[i][0]
        : ((div.offsetLeft - ((Math.random() * 150) - 75)) / containerWidth) * 100;
      const y = values?.[i]
        ? values[i][1]
        : ((div.offsetTop - ((Math.random() * 150) - 75)) / containerHeight) * 100;
      div.setAttribute('style', `left: ${x}%; top: ${y}%;`);
      controlPoints.push([x,y]);
    });

  const controlsContainer = document.getElementById('st-controls');
  controlsContainer.ondrop = (event) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('id');
    const control = document.getElementById(id);
    const clientRect = event.currentTarget.getBoundingClientRect();

    const left = event.clientX - clientRect.left;
    const top = event.clientY - clientRect.top;
    const { height: containerHeight, width: containerWidth } = getElementDimensions(controlsContainer);
    const x = (left / containerWidth) * 100;
    const y = (top / containerHeight) * 100;

    if (!isInside([x,y], [...labelPoints].sort(sortPoints))) {
      return;
    }

    controlPoints[parseInt(id.split('-')[1])] = [x,y];

    control.setAttribute('style', `top: ${y}%; left: ${x}%;`);
    renderPolygon(
      controlPoints,
      controlsContainer,
      controlsContainer,
      foregroundColor,
    );
    onChange(controlPoints);
  };
  controlsContainer.ondragover = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move"
  };

  renderPolygon(
    controlPoints,
    controlsContainer,
    controlsContainer,
    foregroundColor,
  );

  onChange(controlPoints);
}
