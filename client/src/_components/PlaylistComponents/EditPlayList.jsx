import Modal from "../Modals/Modal";
import useFormData from "@/hooks/useFormData";
import tuneMateInstance from "@/service/api/api";
import usePlayerStore from "@/store/use-player";
import Toast from "@/utils/Toasts/Toast";
import { mutate as globalMutate } from "swr";
import useModalStore from "@/store/use-modal-store";

const EditPlayList = () => {
  const { playlistForEdit } = usePlayerStore();
  const { closeModal } = useModalStore();

  const { data, handleChange, handleSubmit, isLoading, resetData } =
    useFormData(
      {
        newPlaylistName: "",
        playlistForEdit
      },
      tuneMateInstance.editUserPlaylist
    );

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await handleSubmit(playlistForEdit.id);
      if (response.data) {
        Toast({ type: response.data.type, message: response.data.message });
        resetData();
        await globalMutate("user-playlists");
        await globalMutate(["user-playlist", playlistForEdit.id]);
        closeModal();
      }
    } catch (error) {
      Toast({
        type: "error",
        message: "Failed to edit playlist. Please try again."
      });
    }
  };

  return (
    <Modal>
      <div className="p-4 w-96">
        <h2 className="text-xl text-white mb-4">Edit Playlist</h2>
        <form className="flex flex-col gap-4" onSubmit={handleEdit}>
          <input
            type="text"
            placeholder="Playlist Name"
            name="newPlaylistName"
            onChange={handleChange}
            defaultValue={playlistForEdit?.name}
            className="p-2 border border-gray-700 rounded-lg text-white bg-[#1e1e1e] outline-none focus:border-cyan-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg cursor-pointer text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default EditPlayList;