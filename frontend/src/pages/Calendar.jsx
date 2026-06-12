import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Link,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Avatar,
  Popover,
  IconButton
} from '@mui/material';
import {
  Search,
  EventNote,
  LocationOn,
  School,
  CalendarToday,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { api } from '../context/AuthContext';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Details Modal State
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Controlled calendar navigation & view state
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');

  // Hover Popover States
  const [hoverAnchorPosition, setHoverAnchorPosition] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Multi-Select Filter States
  const [selectedStatuses, setSelectedStatuses] = useState({
    active: true,
    completed: true,
    inactive: true
  });
  const [selectedDivisions, setSelectedDivisions] = useState({});
  const [selectedTrainers, setSelectedTrainers] = useState({});

  // Fetch batches
  const fetchBatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('batches/');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load batch calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Initialize filter lists when batches are loaded
  useEffect(() => {
    if (batches.length > 0) {
      // Collect divisions
      const divs = {};
      batches.forEach(b => {
        const parts = b.location.split('>');
        const div = parts[0] ? parts[0].trim() : '';
        if (div) {
          divs[div] = true;
        }
      });
      setSelectedDivisions(divs);

      // Collect trainers
      const trs = {};
      batches.forEach(b => {
        if (b.trainers_details) {
          b.trainers_details.forEach(t => {
            trs[t.id] = true;
          });
        }
      });
      setSelectedTrainers(trs);
    }
  }, [batches]);

  // Extract unique divisions dynamically
  const divisions = Array.from(
    new Set(
      batches
        .map(b => {
          const parts = b.location.split('>');
          return parts[0] ? parts[0].trim() : '';
        })
        .filter(d => d !== '')
    )
  ).sort();

  // Extract unique trainers dynamically
  const trainersList = (() => {
    const trainersMap = {};
    batches.forEach(b => {
      if (b.trainers_details) {
        b.trainers_details.forEach(t => {
          trainersMap[t.id] = t;
        });
      }
    });
    return Object.values(trainersMap).sort((a, b) => a.full_name.localeCompare(b.full_name));
  })();

  // Select/Deselect All Trainers
  const handleSelectAllTrainers = (checked) => {
    const nextVal = {};
    trainersList.forEach(t => {
      nextVal[t.id] = checked;
    });
    setSelectedTrainers(nextVal);
  };

  // Select/Deselect All Divisions
  const handleSelectAllDivisions = (checked) => {
    const nextVal = {};
    divisions.forEach(d => {
      nextVal[d] = checked;
    });
    setSelectedDivisions(nextVal);
  };

  // Filter batches by selected states
  const getFilteredBatches = () => {
    return batches.filter(b => {
      // 1. Status filter
      if (!selectedStatuses[b.status]) return false;

      // 2. Division filter
      const parts = b.location.split('>');
      const div = parts[0] ? parts[0].trim() : '';
      if (div && selectedDivisions[div] === false) return false;

      // 3. Trainer filter
      if (b.trainers_details && b.trainers_details.length > 0) {
        const hasMatchingTrainer = b.trainers_details.some(t => selectedTrainers[t.id] !== false);
        if (!hasMatchingTrainer) return false;
      }

      // 4. Text search filter
      const query = searchQuery.toLowerCase();
      if (query) {
        const matchesSearch = 
          b.batch_name.toLowerCase().includes(query) ||
          b.location.toLowerCase().includes(query) ||
          (b.cohort_details?.name && b.cohort_details.name.toLowerCase().includes(query)) ||
          (b.trainers_details && b.trainers_details.some(t => t.full_name.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  // Map filtered batches to react-big-calendar events format
  const getEventsList = () => {
    const list = [];
    getFilteredBatches().forEach(b => {
      // 1. Original Batch event
      list.push({
        id: `batch-${b.id}`,
        title: b.batch_name,
        start: new Date(b.start_date),
        end: new Date(b.start_date),
        allDay: true,
        eventType: 'batch',
        resource: b
      });

      // 2. Stages events (Basic, Refresher 1, Refresher 2)
      if (b.stages) {
        b.stages.forEach(stage => {
          if (stage.status !== 'pending' && stage.start_date) {
            list.push({
              id: `stage-${stage.id}`,
              title: `${b.batch_name} - ${stage.stage_type_display} (${stage.format_display || 'Face-to-Face'})`,
              start: new Date(stage.start_date),
              end: new Date(stage.end_date),
              allDay: true,
              eventType: 'stage',
              stageType: stage.stage_type,
              resource: b,
              stageResource: stage
            });
          }
        });
      }
    });
    return list;
  };

  const events = getEventsList();

  const handleEventClick = (batch, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  // Event chip backgrounds with vibrant linear gradients
  const eventStyleGetter = (event) => {
    let background = 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'; // active - emerald green gradient
    
    if (event.eventType === 'stage') {
      if (event.stageType === 'basic') {
        background = 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'; // basic - indigo gradient
      } else if (event.stageType === 'refresher_1') {
        background = 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'; // refresher_1 - rose/pink gradient
      } else if (event.stageType === 'refresher_2') {
        background = 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'; // refresher_2 - violet/purple gradient
      }
    } else {
      const batch = event.resource;
      if (batch.status === 'completed') {
        background = 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)'; // completed - royal blue gradient
      } else if (batch.status === 'inactive') {
        background = 'linear-gradient(135deg, #616161 0%, #8d8d8d 100%)'; // inactive - slate grey gradient
      }
    }
    
    return {
      style: {
        background,
        borderRadius: '8px',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        boxShadow: '0 3px 6px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        padding: '0px',
        transition: 'transform 0.15s ease'
      }
    };
  };

  // Helper to generate initials from full name
  const getTrainerInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName[0].toUpperCase();
  };

  // Mini Calendar grid builder
  const getMiniCalendarWeeks = (currentDate) => {
    const startOfMonth = moment(currentDate).startOf('month');
    const startDayOfWeek = startOfMonth.day();
    const daysInMonth = startOfMonth.daysInMonth();
    
    const weeks = [];
    let currentWeek = Array(7).fill(null);
    
    // Fill in previous month's trailing days
    const prevMonth = moment(currentDate).subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek[i] = {
        date: moment(currentDate).subtract(1, 'month').date(daysInPrevMonth - startDayOfWeek + 1 + i),
        isCurrentMonth: false
      };
    }
    
    // Fill in current month's days
    let day = 1;
    let dayIndex = startDayOfWeek;
    while (day <= daysInMonth) {
      if (dayIndex === 7) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
        dayIndex = 0;
      }
      currentWeek[dayIndex] = {
        date: moment(currentDate).date(day),
        isCurrentMonth: true
      };
      day++;
      dayIndex++;
    }
    
    // Fill in next month's leading days
    let nextMonthDay = 1;
    while (dayIndex < 7) {
      currentWeek[dayIndex] = {
        date: moment(currentDate).add(1, 'month').date(nextMonthDay),
        isCurrentMonth: false
      };
      nextMonthDay++;
      dayIndex++;
    }
    weeks.push(currentWeek);
    
    return weeks;
  };

  // Find if there are batches starting on a date
  const getBatchDotsForDate = (dateObj) => {
    const dateString = dateObj.format('YYYY-MM-DD');
    const matches = batches.filter(b => b.start_date === dateString);
    return matches.map(b => b.status);
  };

  const handleMiniCalendarDayClick = (clickedDate) => {
    setDate(clickedDate.toDate());
  };

  const handlePrevMonth = () => {
    setDate(moment(date).subtract(1, 'month').toDate());
  };

  const handleNextMonth = () => {
    setDate(moment(date).add(1, 'month').toDate());
  };

  // Custom event renderer inside react-big-calendar
  const CustomEvent = ({ event }) => {
    const batch = event.resource;

    const handleMouseEnter = (e) => {
      setHoverAnchorPosition({
        top: e.clientY + 12,
        left: e.clientX + 12
      });
      setHoveredEvent(batch);
    };

    const handleMouseLeave = () => {
      setHoverAnchorPosition(null);
      setHoveredEvent(null);
    };

    return (
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          px: 1,
          py: 0.5,
          cursor: 'pointer'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flexGrow: 1 }}>
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'white',
              flexShrink: 0
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: 'white',
              fontSize: '0.72rem'
            }}
          >
            {event.title}
          </Typography>
        </Box>

        {batch.trainers_details && batch.trainers_details.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5, flexShrink: 0 }}>
            {batch.trainers_details.slice(0, 2).map(t => (
              <Box
                key={t.id}
                sx={{
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 800,
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
                title={t.full_name}
              >
                {getTrainerInitials(t.full_name)}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const popoverOpen = Boolean(hoverAnchorPosition) && Boolean(hoveredEvent);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Title */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box 
          sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'primary.light', 
            color: 'primary.main' 
          }}
        >
          <EventNote />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Batch Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage scheduled training hubs, instructors, and timelines in a fully unified Google Calendar design.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Main 3-Column Grid Layout */}
      <Grid container spacing={3}>
        {/* Column 1: Left Sidebar Filters (Mini Calendar, Status Filters, Division Filters) */}
        <Grid item xs={12} md={3} lg={2.6}>
          <Card 
            sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2.5, 
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none'
            }}
          >
            {/* 1. Mini Calendar Sync */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {moment(date).format('MMMM YYYY')}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={handlePrevMonth} sx={{ p: 0.5 }}>
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5 }}>
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Days Header */}
              <Grid container spacing={0.5} columns={7} sx={{ textAlign: 'center', mb: 1 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <Grid item xs={1} key={idx}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 800, 
                        color: 'text.secondary', 
                        fontSize: '0.68rem',
                        display: 'block' 
                      }}
                    >
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Weeks Grid */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {getMiniCalendarWeeks(date).map((week, wIdx) => (
                  <Grid container spacing={0.5} columns={7} key={wIdx} sx={{ textAlign: 'center' }}>
                    {week.map((dayObj, dIdx) => {
                      const isSelected = dayObj.date.isSame(date, 'day');
                      const isToday = dayObj.date.isSame(moment(), 'day');
                      const dots = getBatchDotsForDate(dayObj.date);

                      return (
                        <Grid item xs={1} key={dIdx}>
                          <Button
                            onClick={() => handleMiniCalendarDayClick(dayObj.date)}
                            sx={{
                              minWidth: 0,
                              width: '100%',
                              aspectRatio: '1',
                              p: 0,
                              borderRadius: '50%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              bgcolor: isSelected ? 'primary.main' : 'transparent',
                              color: isSelected ? 'white' : dayObj.isCurrentMonth ? 'text.primary' : 'text.disabled',
                              border: isToday && !isSelected ? '1.5px solid' : 'none',
                              borderColor: 'primary.main',
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.main' : 'action.hover'
                              }
                            }}
                          >
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: isSelected || isToday ? 700 : 500, 
                                fontSize: '0.72rem', 
                                lineHeight: 1,
                                display: 'block',
                                mt: dots.length > 0 && !isSelected ? 0.25 : 0
                              }}
                            >
                              {dayObj.date.date()}
                            </Typography>
                            {/* Dots representing statuses */}
                            {dots.length > 0 && !isSelected && (
                              <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', mt: 0.25 }}>
                                {dots.slice(0, 3).map((status, dotIdx) => (
                                  <Box
                                    key={dotIdx}
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      bgcolor: 
                                        status === 'active' ? 'success.main' :
                                        status === 'completed' ? 'info.main' : 'text.disabled'
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                ))}
              </Box>
            </Box>

            <Divider />

            {/* 2. Status Filters */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1, letterSpacing: '0.5px' }}>
                STATUS FILTERS
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      color="success"
                      checked={selectedStatuses.active}
                      onChange={(e) => setSelectedStatuses(prev => ({ ...prev, active: e.target.checked }))}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Active</Typography>
                    </Box>
                  }
                  sx={{ mb: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      color="info"
                      checked={selectedStatuses.completed}
                      onChange={(e) => setSelectedStatuses(prev => ({ ...prev, completed: e.target.checked }))}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Completed</Typography>
                    </Box>
                  }
                  sx={{ mb: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      color="default"
                      checked={selectedStatuses.inactive}
                      onChange={(e) => setSelectedStatuses(prev => ({ ...prev, inactive: e.target.checked }))}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Inactive</Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </Box>

            <Divider />

            {/* 3. Division Filters */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>
                  DIVISION FILTERS
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Link 
                    component="button" 
                    variant="caption" 
                    onClick={() => handleSelectAllDivisions(true)}
                    sx={{ fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    All
                  </Link>
                  <Link 
                    component="button" 
                    variant="caption" 
                    onClick={() => handleSelectAllDivisions(false)}
                    sx={{ fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    None
                  </Link>
                </Box>
              </Box>
              <Box 
                sx={{ 
                  maxHeight: 160, 
                  overflowY: 'auto', 
                  pr: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                {divisions.length > 0 ? (
                  divisions.map(div => (
                    <FormControlLabel
                      key={div}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedDivisions[div] !== false}
                          onChange={(e) => setSelectedDivisions(prev => ({ ...prev, [div]: e.target.checked }))}
                        />
                      }
                      label={<Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{div}</Typography>}
                      sx={{ m: 0 }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No division locations seeded
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Column 2: Center Calendar Display (950px Width) */}
        <Grid item xs={12} sx={{ width: { md: 950 }, maxWidth: { md: 950 }, flexShrink: 0 }}>
          {/* Header Search Filter Bar */}
          <Card 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 3, 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                {getFilteredBatches().length} Batches Matches
              </Typography>

              <TextField
                label="Search batch schedules"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 280, bgcolor: 'background.paper' }}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1, fontSize: '1.2rem' }} />
                }}
              />
            </Box>
          </Card>

          {/* Calendar Box */}
          <Card 
            sx={{ 
              p: 2, 
              borderRadius: 3, 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              overflow: 'hidden' 
            }}
          >
            {loading && batches.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 450 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  '& .rbc-calendar': {
                    '--divider-color': theme.palette.divider,
                    '--bg-paper': theme.palette.background.paper,
                    '--bg-off-range': theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    '--bg-today': theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.04)',
                    '--primary-main': theme.palette.primary.main,
                    '--primary-light': theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                    '--header-bg': theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.06)',
                    '--header-text': theme.palette.primary.main,
                    '--bg-weekend': theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)'
                  }
                }}
              >
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  views={['month', 'week', 'day', 'agenda']}
                  date={date}
                  onNavigate={(newDate) => setDate(newDate)}
                  view={view}
                  onView={(newView) => setView(newView)}
                  onSelectEvent={(event, e) => handleEventClick(event.resource, e)}
                  eventPropGetter={eventStyleGetter}
                  components={{
                    event: CustomEvent
                  }}
                  style={{ height: 620 }}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Column 3: Right Sidebar Column for Trainer Directory Filters */}
        <Grid item xs={12} md={2.5} lg={2}>
          <Card 
            sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              height: 'fit-content'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>
                TRAINERS
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Link 
                  component="button" 
                  variant="caption" 
                  onClick={() => handleSelectAllTrainers(true)}
                  sx={{ fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                >
                  All
                </Link>
                <Link 
                  component="button" 
                  variant="caption" 
                  onClick={() => handleSelectAllTrainers(false)}
                  sx={{ fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                >
                  None
                </Link>
              </Box>
            </Box>

            <Divider />

            <Box 
              sx={{ 
                maxHeight: 450, 
                overflowY: 'auto', 
                pr: 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              {trainersList.length > 0 ? (
                trainersList.map(t => (
                  <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Checkbox
                      size="small"
                      checked={selectedTrainers[t.id] !== false}
                      onChange={(e) => setSelectedTrainers(prev => ({ ...prev, [t.id]: e.target.checked }))}
                      sx={{ p: 0.25 }}
                    />
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '9px', 
                        bgcolor: 'primary.main',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {getTrainerInitials(t.full_name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.78rem' }} noWrap title={t.full_name}>
                        {t.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', display: 'block', fontSize: '0.62rem', fontWeight: 600 }}>
                        {t.role.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No trainers loaded
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Hover Popover Details Card */}
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none'
        }}
        open={popoverOpen}
        anchorReference="anchorPosition"
        anchorPosition={hoverAnchorPosition || undefined}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={() => {
          setHoverAnchorPosition(null);
          setHoveredEvent(null);
        }}
        disableRestoreFocus
        PaperProps={{
          sx: {
            p: 0,
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            width: 290,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            mt: 0.5
          }
        }}
      >
        {hoveredEvent && (
          <Box sx={{ p: 2, pb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: '0.85rem' }} noWrap>
                {hoveredEvent.batch_name}
              </Typography>
              <Chip 
                label={hoveredEvent.status} 
                size="small"
                color={
                  hoveredEvent.status === 'active' ? 'success' : 
                  hoveredEvent.status === 'completed' ? 'info' : 'default'
                }
                sx={{ textTransform: 'capitalize', fontWeight: 700, height: 18, fontSize: '0.62rem' }}
              />
            </Box>
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {/* Cohort info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {hoveredEvent.cohort_details?.name}
                </Typography>
              </Box>

              {/* Location info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {hoveredEvent.location.replace(/ > /g, ' • ')}
                </Typography>
              </Box>

              {/* Start Date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Starts: {moment(hoveredEvent.start_date).format('MMMM DD, YYYY')}
                </Typography>
              </Box>

              {/* Trainers Details */}
              {hoveredEvent.trainers_details && hoveredEvent.trainers_details.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5, letterSpacing: '0.2px' }}>
                    INSTRUCTORS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {hoveredEvent.trainers_details.map(t => (
                      <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 18, 
                            height: 18, 
                            fontSize: '8px', 
                            bgcolor: 'primary.main', 
                            fontWeight: 800 
                          }}
                        >
                          {getTrainerInitials(t.full_name)}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {t.full_name} <span style={{ opacity: 0.6 }}>({t.role.replace('_', ' ')})</span>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Enrolled Participant count */}
              <Box sx={{ pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Enrolled Trainees:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {hoveredEvent.participant_count} Trainees
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Popover>

      {/* Click Dialog Details Modal */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, minWidth: { xs: '90%', sm: 460 }, p: 1 }
        }}
      >
        {selectedBatch && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Link 
                variant="h6"
                color="primary"
                sx={{ 
                  fontWeight: 800, 
                  textDecoration: 'none', 
                  '&:hover': { textDecoration: 'underline', cursor: 'pointer' } 
                }}
                onClick={() => {
                  setDetailsOpen(false);
                  navigate(`/batches/${selectedBatch.id}`);
                }}
              >
                {selectedBatch.batch_name}
              </Link>
              <Chip 
                label={selectedBatch.status} 
                color={
                  selectedBatch.status === 'active' ? 'success' : 
                  selectedBatch.status === 'completed' ? 'info' : 'default'
                }
                size="small"
                sx={{ textTransform: 'capitalize', fontWeight: 700 }}
              />
            </DialogTitle>
            <Divider sx={{ mx: 2 }} />
            <DialogContent sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    COHORT
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedBatch.cohort_details?.name} ({selectedBatch.cohort_details?.cohort_code})
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    LOCATION / DIVISION
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedBatch.location.replace(/ > /g, ' • ')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    START DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedBatch.start_date}
                  </Typography>
                </Grid>
 
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    ASSIGNED TRAINERS
                  </Typography>
                  {selectedBatch.trainers_details && selectedBatch.trainers_details.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {selectedBatch.trainers_details.map(t => (
                        <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                          <Typography variant="body2">
                            <strong>{t.full_name}</strong> ({t.role.replace('_', ' ')}) — <span style={{ color: 'gray' }}>{t.email}</span>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No trainers assigned to this batch
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ENROLLED TRAINEES
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedBatch.participant_count} Trainees
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setDetailsOpen(false)}
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setDetailsOpen(false);
                  navigate(`/batches/${selectedBatch.id}`);
                }}
                sx={{ borderRadius: 2 }}
              >
                Go to Batch Profile
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Calendar;
