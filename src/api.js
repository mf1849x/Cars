async function request(url, options) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getCars(queryString = "") {
  return request(`/api/cars${queryString}`);
}

export function getCar(id) {
  return request(`/api/cars/${id}`);
}

export function createCar(payload) {
  return request("/api/cars", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCar(id, payload) {
  return request(`/api/cars/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCar(id) {
  return request(`/api/cars/${id}`, {
    method: "DELETE",
  });
}
