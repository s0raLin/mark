export const IPC_COMMANDS = {
  users: {
    getSettings: "users_get_settings",
    updateSettings: "users_update_settings",
  },
  editorConfig: {
    get: "editor_config_get",
    update: "editor_config_update",
  },
  fileSystem: {
    getTree: "file_system_get_tree",
    updateTree: "file_system_update_tree",
  },
  files: {
    getContent: "files_get_content",
    updateContent: "files_update_content",
    create: "files_create",
  },
  folders: {
    create: "folders_create",
  },
  fileNodes: {
    move: "file_nodes_move",
    rename: "file_nodes_rename",
    delete: "file_nodes_delete",
  },
  uploads: {
    storeImage: "uploads_store_image",
    storeFont: "uploads_store_font",
    listImages: "uploads_list_images",
    deleteImage: "uploads_delete_image",
  },
  desktop: {
    openExternal: "desktop_open_external",
    closeWindow: "desktop_close_window",
    getWindowPosition: "desktop_get_window_position",
    setWindowPosition: "desktop_set_window_position",
    listSystemFonts: "desktop_list_system_fonts",
  },
  search: {
    queryFiles: "search_query_files",
  },
} as const;
