document.addEventListener("DOMContentLoaded", () => {
    const config = {
      API_URL: "https://api.adultdatalink.com/eporner/search",
      CATEGORIES_API: "https://api.adultdatalink.com/auntmia/feed/",
      DEFAULT_PARAMS: {
        query: "all",
        per_page: 28,
        page: 1,
        thumbsize: "medium",
        order: "viewed",
        gay: 0,
        lq: 0,
        search_format: "json"
      },
      MAX_RETRIES: 3,
      RETRY_DELAY: 1000
    };
  
    const elements = {
      videoList: document.getElementById("video-list"),
      videoTitle: document.getElementById("video-title"),
      videoIframe: document.getElementById("video-iframe"),
      videoDuration: document.getElementById("video-duration"),
      videoViews: document.getElementById("video-views"),
      prevPageBtn: document.getElementById("prevPageBtn"),
      nextPageBtn: document.getElementById("nextPageBtn"),
      pageNumber: document.getElementById("page-number"),
      detailView: document.getElementById("video-detail"),
      videoTags: document.getElementById("video-tags"),
      thumbGallery: document.getElementById("thumb-gallery"),
      backBtn: document.getElementById("backBtn"),
      searchInput: document.getElementById("searchInput"),
      searchButton: document.getElementById("searchButton"),
      apiContent: document.getElementById("api-content"),
      loadingSpinner: document.getElementById("loading-spinner")
    };
  
    let state = {
      currentPage: 1,
      totalPages: 1,
      currentQuery: config.DEFAULT_PARAMS.query,
      isLoading: false
    };
  
    const utils = {
      showLoading: () => elements.loadingSpinner.classList.remove("hidden"),
      hideLoading: () => elements.loadingSpinner.classList.add("hidden"),
      showError: (message) => {
        elements.videoList.innerHTML = `<div class="col-span-full text-center py-10">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p class="text-xl font-medium">${message}</p>
          <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Recargar</button>
        </div>`;
      },
      fetchWithRetry: async (url, options = {}, retries = config.MAX_RETRIES) => {
        try {
          const response = await fetch(url, options);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
            return utils.fetchWithRetry(url, options, retries - 1);
          }
          throw error;
        }
      }
    };
  
    async function loadVideos(page = 1, query = state.currentQuery) {
      try {
        state.isLoading = true;
        state.currentPage = page;
        state.currentQuery = query;
  
        utils.showLoading();
        elements.videoList.innerHTML = "";
  
        const params = { ...config.DEFAULT_PARAMS, page, query };
        const queryString = new URLSearchParams(params).toString();
        const data = await utils.fetchWithRetry(`${config.API_URL}?${queryString}`);
  
        // Verificar la respuesta de la API
        console.log(data); // Verifica la respuesta de la API
        state.totalPages = data.total_pages || 1; // Asigna el total de páginas desde la respuesta
  
        // Mostrar videos
        data.videos.forEach((video) => {
          const div = document.createElement("div");
          div.className = "bg-gray-800 p-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 cursor-pointer";
          div.innerHTML = `
            <div class="relative">
              <img src="${video.default_thumb.src}" alt="${video.title}" class="w-full h-44 object-cover rounded-md mb-2">
              <span class="absolute bottom-4 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">${video.length_min}</span>
            </div>
            <h3 class="font-semibold text-base line-clamp-2">${video.title}</h3>
            <p class="text-sm text-gray-400 mt-1 flex items-center gap-1"><i class="far fa-eye"></i> ${video.views.toLocaleString()}</p>
          `;
          div.addEventListener("click", () => showVideoDetail(video));
          elements.videoList.appendChild(div);
        });
  
        updatePaginationControls();
  
      } catch (error) {
        console.error("Error al cargar videos:", error);
        utils.showError("No se pudieron cargar los videos. Inténtalo de nuevo.");
      } finally {
        state.isLoading = false;
        utils.hideLoading();
      }
    }
  
    function showVideoDetail(video) {
      elements.videoList.classList.add("hidden");
      elements.detailView.classList.remove("hidden");
      elements.videoTitle.textContent = video.title;
      elements.videoIframe.src = video.embed;
      elements.videoDuration.querySelector("span").textContent = video.length_min;
      elements.videoViews.querySelector("span").textContent = video.views.toLocaleString();
      elements.videoTags.innerHTML = "";
  
      if (video.keywords) {
        video.keywords.split(",").slice(0, 15).forEach(tag => {
          const span = document.createElement("span");
          span.textContent = tag.trim();
          span.className = "bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-sm inline-block hover:bg-indigo-200 transition";
          elements.videoTags.appendChild(span);
        });
      }
  
      elements.thumbGallery.innerHTML = "";
      (video.thumbs || []).slice(0, 8).forEach(thumb => {
        const img = document.createElement("img");
        img.src = thumb.src;
        img.alt = "Thumbnail";
        img.className = "w-full h-16 object-cover rounded-md border-2 border-gray-200 hover:border-indigo-400 transition cursor-pointer";
        elements.thumbGallery.appendChild(img);
      });
  
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  
    function updatePaginationControls() {
      console.log(`Páginas totales: ${state.totalPages}`); // Verifica cuántas páginas hay
      elements.pageNumber.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
      elements.prevPageBtn.disabled = state.currentPage <= 1;
      elements.nextPageBtn.disabled = state.currentPage >= state.totalPages;
    }
  
    async function loadCategories() {
      try {
        const data = await utils.fetchWithRetry(config.CATEGORIES_API);
        const items = Array.isArray(data) ? data : [data];
  
        elements.apiContent.innerHTML = items.map(item => `        
          <a href="${item.link_url || "#"}" target="_blank" class="bg-gray-800 p-3 rounded-lg shadow-md hover:shadow-lg block group">
            <div class="relative overflow-hidden rounded-md mb-2">
              <img src="${item.thumbnail_url}" alt="${item.title}" class="w-full h-32 object-cover group-hover:scale-105 transition duration-300">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span class="absolute bottom-2 left-2 text-white text-sm font-medium">${item.category || "Sin categoría"}</span>
            </div>
            <h3 class="font-semibold text-sm line-clamp-2">${item.title}</h3>
          </a>
        `).join("");
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        elements.apiContent.innerHTML = `<div class="col-span-full text-center py-6"><p class="text-red-500">No se pudieron cargar las categorías.</p></div>`;
      }
    }
  
    // Event Listeners
    elements.backBtn.addEventListener("click", () => {
      elements.detailView.classList.add("hidden");
      elements.videoList.classList.remove("hidden");
    });
  
    elements.nextPageBtn.addEventListener("click", () => {
      if (!state.isLoading && state.currentPage < state.totalPages) {
        loadVideos(state.currentPage + 1, elements.searchInput.value.trim() || state.currentQuery);
      }
    });
  
    elements.prevPageBtn.addEventListener("click", () => {
      if (!state.isLoading && state.currentPage > 1) {
        loadVideos(state.currentPage - 1, elements.searchInput.value.trim() || state.currentQuery);
      }
    });
  
    elements.searchButton.addEventListener("click", () => {
      const query = elements.searchInput.value.trim();
      if (query && !state.isLoading) loadVideos(1, query);
    });
  
    elements.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = elements.searchInput.value.trim();
        if (query && !state.isLoading) loadVideos(1, query);
      }
    });
  
    // Init
    loadVideos(state.currentPage, state.currentQuery);
    loadCategories();
});
