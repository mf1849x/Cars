let authToken = localStorage.getItem("cars-auth-token") || "";

function buildHeaders(headers = {}) {
  const nextHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authToken) {
    nextHeaders.Authorization = `Bearer ${authToken}`;
  }

  return nextHeaders;
}

export function setAuthToken(token) {
  authToken = token || "";

  if (authToken) {
    localStorage.setItem("cars-auth-token", authToken);
  } else {
    localStorage.removeItem("cars-auth-token");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cars-auth-changed"));
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
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

export function getUsers() {
  return request("/api/users");
}

export function createUser(payload) {
  return request("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return request(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id) {
  return request(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }).then((data) => {
    setAuthToken(data.token);
    return data;
  });
}

export function register(email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }).then((data) => {
    setAuthToken(data.token);
    return data;
  });
}

export function getCurrentUser() {
  return request("/api/auth/me");
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST",
  }).finally(() => {
    setAuthToken("");
  });
}
