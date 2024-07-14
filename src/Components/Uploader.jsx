import React, { useEffect, useState } from "react";
import UploadingIcon from "../reusable/UploadingIcon";
import axios from "axios";
import { LoaderIcon } from "react-hot-toast";
import useVideo from "../Hooks/useVideo";

const CancelToken = axios.CancelToken;
let cancel;

function Uploader() {
  const {fetchVideos} = useVideo()
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [file, setFile] = useState(null);

  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggedOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggedOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggedOver(false);

    setFileName(e.dataTransfer.files[0].name);
    setFile(e.dataTransfer.files[0]);
    e.dataTransfer.clearData();
  };

  const cancelUploading = () => {
    setIsUploading(false);
    setProcessing(false);
    setFileName("");
    setProgress(0);
    setFile(null);

    if (cancel) cancel();
  };

  const onInputFileChange = (e) => {
    setFileName(e.target.files[0]?.name);
    setFile(e.target.files[0]);
    document.querySelector("#file").value = "";
  };

  //   useEffect(() => {
  //     console.log({ processing, isUploading, progress });
  //   }, [progress, isUploading, processing]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setIsUploading(true);

    try {
      /** @API call */
      const { data } = await axios.post(
        "http://localhost:8060/api/upload-video",
        file,
        {
          headers: {
            filename: fileName,
          },
          withCredentials: "include",
          onUploadProgress: (data) => {
            const progressNumber = Math.round((100 * data.loaded) / data.total);
            setProgress(progressNumber);
            if (progressNumber === 100) setProcessing(true);
          },
          cancelToken: new CancelToken(function executor(c) {
            cancel = c;
          }),
        }
      );
      if (data.status === "success") {
        showMessage("File was uploaded successfully!", "success");
        fetchVideos();
      }
    } catch (e) {
      // console.log(e.response.data);
      if (e.response && e.response.data.error)
        showMessage(e.response.data.error, "error");
    } finally {
      cancelUploading();
    }
  };

  const showMessage = (message, status) => {
    if (status === "success") {
      setSuccessMsg(message);
      setTimeout(() => {
        setSuccessMsg("");
      }, 2500);
    }

    if (status === "error") {
      setErrorMsg(message);
      setTimeout(() => {
        setErrorMsg("");
      }, 2500);
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`h-64 relative bg-white grid place-content-center place-items-center rounded border-dashed border-gray-400 border-2 ${
        isDraggedOver ? "!bg-green-50" : ""
      } ${successMsg ? "!bg-green-400 border-green-400" : ""} ${
        errorMsg ? "!bg-red-500/80 border-gray-800" : ""
      }`}
      onDrag={handleDragStart}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragLeave}
      onDrop={handleDrop}
    >
      {successMsg || errorMsg || processing ? (
        <div
          className={`text-3xl text-gray-700 flex flex-col items-center font-bold ${
            errorMsg ? "text-white" : ""
          }`}
        >
          {successMsg || errorMsg || "Processing your video file."}
          {processing && <LoaderIcon className="w-7 h-7 mt-2" />}
        </div>
      ) : (
        <>
          <input
            className="hidden"
            type="file"
            name="file"
            id="file"
            onChange={onInputFileChange}
          />
          {isUploading ? <UploadingIcon animated={true} /> : <UploadingIcon />}
          {isUploading && <span className="text-center">{progress}%</span>}
          <div className="flex items-center gap-2 mt-2 text-gray-600">
            {!isUploading && (
              <div className="text-lg">
                <label
                  htmlFor="file"
                  className="hover:underline cursor-pointer"
                >
                  {fileName ? (
                    <strong>{fileName}</strong>
                  ) : isDraggedOver ? (
                    <span>You can now drop your video!</span>
                  ) : (
                    <>
                      <strong>Choose a video file</strong>
                      <span className="box__dragndrop">
                        {" "}
                        or drag and drop it here
                      </span>
                      .
                    </>
                  )}
                </label>
              </div>
            )}
            {fileName && !isUploading && (
              <button
                className="bg-blue-500 text-white font-bold p-2 px-4 rounded"
                type="submit"
              >
                Upload
              </button>
            )}
          </div>
          {isUploading && (
            <div className="mt-2 text-gray-600 text-lg">
              Uploading <strong className="text-gray-800"> {fileName}</strong>
              <button
                className="bg-red-400 text-white p-2 px-4 rounded font-bold ml-2"
                type="submit"
                onClick={cancelUploading}
              >
                Cancel
              </button>
            </div>
          )}
          <div
            className="absolute left-0 bg-emerald-300/40 w-full h-full transition-[width] duration-300"
            style={{ width: progress + "%" }}
          ></div>
        </>
      )}
    </form>
  );
}

export default Uploader;
