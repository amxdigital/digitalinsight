import React, { useState, useEffect, useRef } from "react";
import { Table } from "reactstrap";
import { useTable, useSortBy, useFilters, usePagination } from "react-table";
import { displayFormatsMap, defaultDisplayFormat, getFilteredDisplayFormats, getDayFilteredDisplayFormats, getReportData } from "@modules/Charts/constants";
import { Api } from "@services/ApiService";
import FormField from "@modules/Common/FormField";
import { Row, Col, Button, Input, CustomInput } from "reactstrap";
import { ToastUtil } from "@modules/utils";
import Util from "@modules/utils/Util";

const DefaultColumnFilter = ({
    column: {
        filterValue,
        setFilter,
        preFilteredRows: { length }
    }
}) => {
    return (
        <Input
            value={filterValue || ""}
            onChange={e => {
                setFilter(e.target.value || undefined);
            }}
            placeholder={`search (${length}) ...`}
        />
    );
};

const SelectColumnFilter = ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
    const options = React.useMemo(() => {
        const options = new Set();
        preFilteredRows.forEach(row => {
            options.add(row.values[id]);
        });
        return [...options.values()];
    }, [id, preFilteredRows]);

    return (
        <CustomInput
            id="custom-select"
            type="select"
            value={filterValue}
            onChange={e => {
                setFilter(e.target.value || undefined);
            }}
        >
            <option value="">All</option>
            {options.map(option => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </CustomInput>
    );
};

const generateSortingIndicator = column => {
    return column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : "";
};

const Filter = ({ column }) => {
    return <div style={{ marginTop: 5 }}>{column.canFilter && column.render("Filter")}</div>;
};

export default function UserJourney() {
    const [loading, setLoading] = useState(false);

    const [opts, setOpts] = useState([]);
    const [profileSelectOpts, setProfileSelectOpts] = useState([]);
    const [disableEventFilters, setDisableEventFilters] = useState({column: false, profile: false});
    const [showProfileNamefield,  setShowProfileNamefield] = useState(false);
    const [disableAddProfileNameBtn, setDisableAddProfileNameBtn] = useState(true);
    const [reportPeriodVal, setReportPeriodVal] = useState([]);
    const [generateReportLoading, setGenerateReportLoading] = useState(false);
    const [selectedOpt, setSelectedOpt] = useState([]);

    const [tableStuff, setTableStuff] = useState({});

    const [timeRange, setTimeRange] = useState({ min: 0, max: 0 });

    const [displayFormat, setDisplayFormat] = useState("");

    const displayFormatRef = useRef();
    const columnsConfigRef = useRef();
    const profileSelectRef = useRef();
    const profileNameRef = useRef();
    const timeRangeMinRef = useRef();

    useEffect(async () => {
        console.log("UserJourney mount - setOpts");

        try {
            let resp = await Api.root.get(
                "/client/register/event",
                {},
                {
                    headers: {
                        consumerKey: "1fxb4orbwe8sr"
                    }
                }
            );
            let results = resp.data.results[0].metaEventDoc;
            setOpts(results.map(el => ({ label: el.eventDesc ? el.eventDesc : el.eventName, value: el.eventName })));
            
            fetchProfileOpts();
        } catch (error) {
            console.log(error)
        }

        return () => {
            console.log("UserJourney mount - setOpts cleanup ");
        };
    }, []);

    useEffect(async () => {
        console.log("UserJourney mount ");

        setDisplayFormat(defaultDisplayFormat);
        setReportPeriodVal(defaultDisplayFormat);

        const displayFormatDetails = displayFormatsMap[defaultDisplayFormat];
        const displayFormatSuccessor = displayFormatsMap[displayFormatDetails.successor];
        const end = new Date().valueOf();
        const start = end - displayFormatSuccessor.ms;
        setTimeRange(prev => ({ ...prev, min: start, max: end }));

        return () => {
            console.log("UserJourney mount cleanup ");
        };
    }, []);

    const onChangeDisplayFormat = newVal => {
        setDisplayFormat(newVal);
        const displayFormatDetails = displayFormatsMap[newVal.value];
        const displayFormatSuccessor = displayFormatsMap[displayFormatDetails.successor];
        const end = new Date().valueOf();
        const start = end - displayFormatSuccessor.ms;
        setTimeRange(prev => ({ ...prev, min: start, max: end }));
    };

    const fetchData = async (min, max, eventNameList) => {
        let resp = await Api.root.post(
            "/digital/analytics/user-events-count",
            {
                dateRange1: min,
                dateRange1Str: new Date(min),
                dateRange2: max,
                dateRange2Str: new Date(max),
                displayFormat: displayFormat.value,
                eventNameList
            }
        );
        return resp.data.results;
    };

    const fetchProfileOpts = async() => {
        let profileFilterResp = await Api.root.get(
            "/profile/fetch",
            {},
            {
                headers: {consumerKey: "1fxb4orbwe8sr"}
            }
        );
        let profileFilterResults = profileFilterResp.data.results[0].profile;
        setProfileSelectOpts(profileFilterResults.map(el => ({ label: el.filterName, value: el.filterName, eventNames: el.eventNames})));
    }

    const onChangeEventFilters = async(field, newVal) => {
        if(field == "COLUMN" && newVal.length !== 0) {
            setDisableEventFilters({column: false, profile: true})
        } else if (field == "PROFILE" && newVal !== null) {
            setDisableEventFilters({column: true, profile: false})
        } else {
            setDisableEventFilters({column: false, profile: false})
        }
    }

    const onClickSearch = async () => {
        if ([displayFormatRef.current.isValid()].includes(false)) return;
        let configuredCols = columnsConfigRef.current.val() ? columnsConfigRef.current.val() : profileSelectRef.current.val() ? profileSelectRef.current.val().eventNames : [];
        let configuredColsList = columnsConfigRef.current.val() ? configuredCols.map(el => el.value) : profileSelectRef.current.val() ? configuredCols : [];
        let data = await fetchData(timeRange.min, timeRange.max, configuredColsList);
        console.log(
            "UserJourney - Fetched data between " +
                new Date(timeRange.min) +
                " and " +
                new Date(timeRange.max) +
                " for",
            configuredColsList,
            { data }
        );
        setTableStuff(prev => ({
            columns: configuredCols && configuredCols.length ? configuredCols : opts,
            data
        }));
    };

    const onAddProfile = () => {
        setShowProfileNamefield(true); 
        setDisableAddProfileNameBtn(true); 
        setDisableEventFilters({column: false, profile: true})
    }

    const onCloseProfileName = () => {
        setShowProfileNamefield(false); 
        setDisableEventFilters({column: false, profile: false})
    }

    const onChangeProfileName = async() => {
        console.log(profileNameRef.current.val())
        if(profileNameRef.current.val() !== ""){
            setDisableAddProfileNameBtn(false)
        } else {
            setDisableAddProfileNameBtn(true)
        }
    }

    const onSaveProfile = async() => {
        setShowProfileNamefield(true);
        if ([columnsConfigRef.current.isValid()].includes(false)) return;
        
        /*  Duplicate Profile name/event check */
        let columnEventVal = columnsConfigRef.current.val().map(el => el.value);
        let profileEventList = profileSelectOpts.map(el => el.eventNames);
        if (columnEventVal.length <= 1) return ToastUtil.info('Minimum two events must be selected');
        if (profileSelectOpts.find(el => el.label.toUpperCase() === profileNameRef.current.val().toUpperCase())) return ToastUtil.error('Profile name already exists');
        let duplicateEvents = profileEventList.filter(el => {
            if (el.length === columnEventVal.length) return el.every((v,i) => columnEventVal.includes(v))
        })
        if (duplicateEvents.length !== 0) return ToastUtil.error('Profile with same events already exists');
        let newProfileName = profileNameRef.current.val();
        
        try {
            setLoading(true);
            let eventNameList = columnsConfigRef.current.val().map(e => e.value);
            await Api.root.post("/profile/save",
                {
                    eventNames: eventNameList,
                    filterName: newProfileName
                },
                {
                    headers: {consumerKey: "1fxb4orbwe8sr"}
                }
            );
            fetchProfileOpts();
            setShowProfileNamefield(false);
            setLoading(false);
            ToastUtil.success(`${newProfileName} profile added`)
        } catch(error){
            console.log(error)
        }
    }

    const onChangeReportPeriod = newVal => {
        setReportPeriodVal(newVal)
    };

    const onGenerateReport = async() => {
        if ([profileSelectRef.current.isValid()].includes(false)) return;
        try {
            setGenerateReportLoading(true);
            let resp = await Api.root.post(
                '/customer/Info', 
                {
                    dateRange1: timeRange.min,
                    dateRange2: timeRange.max,
                    displayFormat: reportPeriodVal.label,
                    eventNameList: profileSelectRef.current.val().eventNames
                },
                {
                    headers: {
                        consumerKey: "1fxb4orbwe8sr"
                    }
                }
            )
            let profileData = resp.data.results[0].lstCust;
            console.log(profileData);
            if (profileData.length === 0) { 
                return ToastUtil.error('No records available');
            } else {
                let reportData = getReportData(profileData)
                let allRows = [reportData.columnHeaders].concat(reportData.rows);
                let fileName = `User Journey Report - ${reportPeriodVal.label}`
                Util.exportToXLS(allRows, fileName)
            }
        } catch(error) {
            console.log(error);
        } finally {
            setGenerateReportLoading(false);
        }
    }

    let data = React.useMemo(() => {
        console.log("memorising data");
        return tableStuff.data || [];
    }, [tableStuff]);

    let columns = React.useMemo(() => {
        console.log("memorising columns");
        let defaultsCols = [
            {
                Header: "Date / Time",
                accessor: "dateStr"
            }
        ];
        let cols = (tableStuff.columns || []).map(el => ({
            Header: el.label ? el.label: el,
            accessor: el.value ? el.value: el,
            Cell: row => row.value || "-"
        }));
        return cols.length ? defaultsCols.concat(cols) : [];
    }, [tableStuff]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        // rows, -> we change 'rows' to 'page'
        page,
        prepareRow,
        // below new props related to 'usePagination' hook
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize }
    } = useTable(
        { columns, data, defaultColumn: { Filter: DefaultColumnFilter }, initialState: { pageIndex: 0, pageSize: 10 } },
        useFilters,
        useSortBy,
        usePagination
    );

    const onChangeInSelect = event => {
        setPageSize(Number(event.target.value));
    };

    const onChangeInInput = event => {
        const page = event.target.value ? Number(event.target.value) - 1 : 0;
        gotoPage(page);
    };

    console.log("#render#", { columns, data, tableStuff });
    return (
        <>
            <div className={loading ? "loader-inline" : ""}>
                <div className="user-journey table-filters row mb-3">
                    <div className="col-lg-12">
                        <div className="row">
                            <div className="col-lg-3 mb-2">
                                <FormField
                                    ref={displayFormatRef}
                                    controlled={true}
                                    type="select"
                                    id="displayFormat"
                                    label="Unit"
                                    options={Object.entries(getFilteredDisplayFormats()).map(([key, value]) => ({
                                        label: key.toUpperCase(),
                                        value: key
                                    }))}
                                    value={displayFormat}
                                    onChange={onChangeDisplayFormat}
                                />
                            </div>
                            <div className="col-lg-3 mb-2">
                                <div className="form-group">
                                    <label className="form-control-label" htmlFor="start-time">
                                        Start
                                    </label>
                                    <input
                                        style={{ width: "100%", color: !timeRange.min ? "transparent" : "" }}
                                        className={"form-control-alternative form-control"}
                                        type="date"
                                        id="start-time"
                                        value={timeRange.min ? new Date(timeRange.min).toISOString().split("T")[0] : ""}
                                        onChange={e =>
                                            setTimeRange(prev => ({ ...prev, min: new Date(e.target.value).valueOf() }))
                                        }
                                    />
                                </div>
                                {/* <FormField
                                    ref={timeRangeMinRef}
                                    type="date"
                                    id="timeRangeMin"
                                    label="Start"
                                /> */}
                            </div>
                            <div className="col-lg-3 mb-2">
                                <div className="form-group">
                                    <label className="form-control-label" htmlFor="end-time">
                                        End
                                    </label>
                                    <input
                                        style={{ width: "100%", color: !timeRange.max ? "transparent" : "" }}
                                        className={"form-control-alternative form-control"}
                                        type="date"
                                        id="end-time"
                                        value={timeRange.max ? new Date(timeRange.max).toISOString().split("T")[0] : ""}
                                        onChange={e =>
                                            setTimeRange(prev => ({ ...prev, max: new Date(e.target.value).valueOf() }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="col-lg-7 mb-2 profile-select">
                                <label className="form-control-label">Profile</label>
                                <button className="btn btn-primary" title="Add Profile" onClick={onAddProfile}>
                                    <i className="fa fa-plus" />
                                </button>
                                <FormField
                                    ref={profileSelectRef}
                                    type="select"
                                    placeholder={`Select profile`}
                                    options={profileSelectOpts}
                                    isDisabled={disableEventFilters.profile}
                                    onChange={newVal => onChangeEventFilters("PROFILE", newVal)}
                                    isSearchable
                                    isMulti={false}
                                    isClearable={true}
                                />
                            </div>
                            <div className="col-lg-5 mb-2 report-period-section">
                                <div className="report-select">
                                    <FormField
                                        controlled={true}
                                        type="select"
                                        placeholder="Select report period"
                                        options={Object.entries(getDayFilteredDisplayFormats()).map(([key, value]) => ({
                                            label: key.toUpperCase(),
                                            value: key
                                        }))}
                                        value={reportPeriodVal}
                                        onChange={onChangeReportPeriod}
                                    />
                                </div>
                                <button className="btn btn-primary" title="Generate Report" disabled={generateReportLoading} onClick={onGenerateReport}>
                                    {generateReportLoading ? "Loading..." : <i className="fa fa-download" />}
                                </button>
                            </div>
                            <div className="col-lg-9 mb-2">
                                <FormField
                                    ref={columnsConfigRef}
                                    type="select"
                                    id="columnsConfig"
                                    placeholder={`configure columns`}
                                    options={opts}
                                    isDisabled={disableEventFilters.column}
                                    onChange={newVal => onChangeEventFilters("COLUMN", newVal)}
                                    isSearchable
                                    isMulti
                                />
                            </div>
                            {showProfileNamefield 
                            ?   <div className="col-lg-8 mb-2 add-profile-section">
                                    <FormField
                                        ref={profileNameRef}
                                        type="text"
                                        id="addProfile"
                                        placeholder={`Enter Profile Name`}
                                        onChange={onChangeProfileName}
                                    />
                                    <button className="btn btn-primary add" disabled={disableAddProfileNameBtn} onClick={onSaveProfile}>
                                        Save
                                    </button>
                                    <button className="btn btn-primary" style={{margin: "0.5rem 0"}} onClick={onCloseProfileName}>
                                        Close
                                    </button>
                                </div>
                            :   ""}
                            <button className="btn btn-primary search-btn" disabled={false} onClick={onClickSearch}>
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {data.length ? (
                <>
                    {/* <div className="table-responsive">
                    <table {...getTableProps()} className="align-items-center table-flush table"> */}
                    <Table {...getTableProps()} className="align-items-center table-flush" responsive bordered>
                        <thead className="thead-light">
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        // <th {...column.getHeaderProps()}>{column.render("Header")}</th>

                                        // <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                        //     {column.render("Header")}
                                        //     {generateSortingIndicator(column)}
                                        // </th>

                                        <th {...column.getHeaderProps()} style={{ padding: "1rem", fontSize: "13px" }}>
                                            <div {...column.getSortByToggleProps()}>
                                                {column.render("Header")}
                                                {generateSortingIndicator(column)}
                                            </div>
                                            {/* <Filter column={column} /> */}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {page.map(row => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => {
                                            return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    {/* </table>
                </div> */}
                    <Row style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
                        <Col md={3}>
                            <Button color="primary" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                                {"<<"}
                            </Button>
                            <Button color="primary" onClick={previousPage} disabled={!canPreviousPage}>
                                {"<"}
                            </Button>
                        </Col>
                        <Col md={2} style={{ marginTop: 7 }}>
                            Page{" "}
                            <strong>
                                {pageIndex + 1} of {pageOptions.length}
                            </strong>
                        </Col>
                        <Col md={2}>
                            <Input
                                type="number"
                                min={1}
                                style={{ width: 70 }}
                                max={pageOptions.length}
                                defaultValue={pageIndex + 1}
                                onChange={onChangeInInput}
                            />
                        </Col>
                        <Col md={2}>
                            <CustomInput id="page-size" type="select" value={pageSize} onChange={onChangeInSelect}>
                                {[5, 10, 20, 30, 40, 50].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                        Show {pageSize}
                                    </option>
                                ))}
                            </CustomInput>
                        </Col>
                        <Col md={3}>
                            <Button color="primary" onClick={nextPage} disabled={!canNextPage}>
                                {">"}
                            </Button>
                            <Button color="primary" onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                                {">>"}
                            </Button>
                        </Col>
                    </Row>
                </>
            ) : null}
        </>
    );
}
