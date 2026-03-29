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
  search: {
    queryFiles: "search_query_files",
  },
} as const;
