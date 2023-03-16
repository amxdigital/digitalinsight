import React, { Component } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

class ToastUtil extends Component {
    render() {
        return (
            <ToastContainer
                progressClassName="toast-progress"
                className="toast-container"
                position="bottom-right"
                autoClose={12000}
            />
        );
    }
    static success(msg) {
        toast.success(
            <div className="custom-toast">
                <div className="title-container success">
                    <i className="fa fa-check-circle" />
                    &nbsp;
                    <span className="title">SUCCESS</span>
                </div>
                <div className="desc">{msg}</div>
            </div>
        );
    }
    static error(msg, title) {
        toast.error(
            <div className="custom-toast">
                <div className="title-container error">
                    <i className="fa fa-times-circle" />
                    &nbsp;
                    <span className="title">{title || "ERROR"}</span>
                </div>
                <div className="desc">{msg}</div>
            </div>
        );
    }
    static warn(msg) {
        toast.warn(
            <div className="custom-toast">
                <div className="title-container warning">
                    <i className="fa fa-exclamation-triangle" />
                    &nbsp;
                    <span className="title">WARNING</span>
                </div>
                <div className="desc">{msg}</div>
            </div>
        );
    }

    static info(msg) {
        toast.info(
            <div className="custom-toast">
                <div className="title-container info">
                    <i className="fa fa-info-circle" />
                    &nbsp;
                    <span className="title">INFO</span>
                </div>
                <div className="desc">{msg}</div>
            </div>
        );
    }
}

export default ToastUtil;
