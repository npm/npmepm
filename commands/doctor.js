module.exports = {
  command: 'doctor <bundle>',
  desc: 'report on common problems',
  handler
}

function handler ({bundle}) {
  const {green, orange, red, yellow, emoji} = require('@buzuli/color')
  const r = require('ramda')

  const health = tracker()

  require('../lib/bundle')(bundle)
    .on('error', error => {
      console.error(error)
      console.error(emoji.inject(red(`Error reading bundle ${yellow(bundle)}. Details above :point_up:`)))
    })
    .on('file', health.checker)
    .once('end', () => {
      // Summarize doctor's findings

      const issues = health.issues()
      const ic = issues.length // issue count
      const errors = r.filter(({level}) => level === 'error')(issues)
      const warnings = r.filter(({level}) => level === 'warn')(issues)
      const issueIcon = errors.length > 0 ? ':x:' : ':warning:'
      const issueColor = errors.length > 0 ? red : yellow

      if (ic > 0) {
        warnings.forEach(({message}) => {
          console.info(emoji.inject(`:warning:  ${yellow('WARNING')} : ${message}`))
        })
        errors.forEach(({message}) => {
          console.info(emoji.inject(`:x:  ${red('ERROR')} : ${message}`))
        })
        console.log(issueColor(emoji.inject(`${issueIcon}  There ${ic === 1 ? 'is' : 'are'} ${orange(ic)} health issue${ic === 1 ? '' : 's'} with this cluster. Details above :point_up:`)))
      } else {
        console.log(emoji.inject(':white_check_mark: '), green('Appears healthy.'))
      }
    })
}

// Health tracker factory
function tracker () {
  const issues = []
  const checkFile = fileChecker()

  return {
    issues: () => issues,
    checker: context => {
      checkFile({issues, ...context})
    }
  }
}

// Check each file, processing its contents if its path is of interest
function fileChecker () {
  const r = require('ramda')
  const semver = require('semver')
  const {blue, green, orange, purple, yellow} = require('@buzuli/color')

  const {
    parseStream
  } = require('../lib/json')

  const {
    extractLine,
    extractLines
  } = require('../lib/lines')

  return async (context) => {
    const {next, path, skip, stream} = context

    try {
      let testSuffix = 'deadbeef'
      // const testSuffix = 'sysconfig/replicated'

      // XXX:
      // - for testing : ~/Documents/support/HP/2018-02-15

      // TODO:
      // - confirm all expected containers are running
      // - confirm all expected containers have been running for longer than 15 min.

      // Health
      // testSuffix = 'docker_inspect.json' // for each container
      // testSuffix = 'daemon/commands/date'
      // testSuffix = 'daemon/commands/df' // ✅
      // testSuffix = 'daemon/commands/df_inodes' // ✅
      // testSuffix = 'daemon/commands/dmesg' // Cound unique messages
      // testSuffix = 'daemon/commands/free'
      // testSuffix = 'daemon/docker/docker_info.json' // ✅
      // testSuffix = 'daemon/docker/docker_ps_a.json' // ✅
      // testSuffix = 'daemon/proc/cpuinfo' // powerful enough (4+ cores @ 2+ GHz)
      // testSuffix = 'daemon/proc/meminfo' // at least 16GB (ideally 32+)
      // testSuffix = 'daemon/proc/version' // is kernel version problematic?
      // testSuffix = 'daemon/proc/vmstat'
      // testSuffix = 'daemon/etc/systemd/system/docker.service.d/http-proxy.conf'
      // testSuffix = 'daemon/replicated/hostInfo.json'
      // testSuffix = 'daemon/replicated/params.json' // Replicated configuration
      // testSuffix = 'scheduler/nodes.txt' // npme cluster nodes (docker servers)

      // Informational
      // testSuffix = 'errors.txt'
      // testSuffix = 'license.txt' // ✅
      // testSuffix = 'daemon/replicated/daemon.json'
      // testSuffix = 'daemon/etc/sysconfig/replicated'
      // testSuffix = 'daemon/etc/sysconfig/replicated-operator'

      // Advanced
      // testSuffix = 'stderr.log'
      // testSuffix = 'daemon/commands/ip_addr_show'
      // testSuffix = 'daemon/commands/ip_link_show'
      // testSuffix = 'daemon/commands/ip_route_show'
      // testSuffix = 'daemon/journald/replicated-operator.log'
      // testSuffix = 'daemon/journald/replicated-ui.log'
      // testSuffix = 'daemon/journald/replicated.log'
      // testSuffix = 'daemon/replicated/replicated-operator.log'
      // testSuffix = 'daemon/replicated/replicated-ui.log'
      // testSuffix = 'daemon/replicated/replicated.log'
      // testSuffix = 'daemon/replicated/config-commands.txt'
      // testSuffix = 'daemon/replicated/ledis-app.dump'
      // testSuffix = 'daemon/replicated/ledis-registry.dump'
      // testSuffix = 'daemon/replicated/replicated-inspect.json'
      // testSuffix = 'daemon/replicated/replicated-operator-inspect.json'
      // testSuffix = 'daemon/replicated/replicated-ui-inspect.json'
      // testSuffix = 'daemon/replicated/replicated-versions.txt'
      // testSuffix = 'daemon/replicated/runtime/goroutines.txt'
      // testSuffix = 'daemon/replicated/tasks.txt'

      if (r.endsWith(testSuffix)(path)) {
        console.log(blue(path))
        stream().on('end', next)
        stream().pipe(process.stdout)
        next()
      } else if (r.endsWith('/license.txt')(path)) {
        await licenseCheck(context)
        next()
      } else if (r.endsWith('/docker_ps_a.json')(path)) {
        await dockerPsCheck(context)
        next()
      } else if (r.endsWith('/docker_info.json')(path)) {
        await dockerInfoCheck(context)
        next()
      } else if (r.endsWith('/df')(path)) {
        await dfCheck(context)
        next()
      } else if (r.endsWith('/df_inodes')(path)) {
        await dfInodesCheck(context)
        next()
      } else {
        skip()
      }
    } catch (error) {
      next(error)
    }
  }

  function prepPath (path) {
    // Future logic to clean up the path (trimmming prefix, etc.) can be added here later
    return path
  }

  // Check the space usage on each mount
  async function dfCheck ({issues, path, stream}) {
    const lines = await extractLines(line => {
      if (line.match(/^\s*Filesystem/)) {
        return false
      }
      if (line.match(/\/proc\/\S+$/)) {
        return false
      }
      if (line.match(/\/sys\/\S+$/)) {
        return false
      }
      return true
    })(stream())

    const problems = r.compose(
      r.filter(({percent}) => percent >= 80),
      r.map(({percent, path}) => ({percent: Number(percent.replace(/[%]/, '')), path})),
      r.filter(({percent}) => r.trim(percent) !== '-'),
      r.map(([percent, path]) => ({percent, path})),
      r.map(r.takeLast(2)),
      r.filter(parts => parts.length > 2),
      r.map(r.split(/\s+/))
    )(lines)

    problems.forEach(({percent, path: mount}) => {
      const pct = orange(`${percent}%`)
      issues.push({
        level: percent > 97 ? 'error' : 'warn',
        message: `Space usage is at ${pct} for mount ${green(mount)} [${blue(prepPath(path))}]`
      })
    })
  }

  // Check the inode usage on each mount
  async function dfInodesCheck ({issues, path, stream}) {
    const lines = await extractLines(line => {
      if (line.match(/^\s*Filesystem/)) {
        return false
      }
      if (line.match(/\/proc\/\S+$/)) {
        return false
      }
      if (line.match(/\/sys\/\S+$/)) {
        return false
      }
      return true
    })(stream())

    const problems = r.compose(
      r.filter(({percent}) => percent >= 80),
      r.map(({percent, path}) => ({percent: Number(percent.replace(/[%]/, '')), path})),
      r.filter(({percent}) => r.trim(percent) !== '-'),
      r.map(([percent, path]) => ({percent, path})),
      r.map(r.takeLast(2)),
      r.filter(parts => parts.length > 2),
      r.map(r.split(/\s+/))
    )(lines)

    problems.forEach(({percent, path: mount}) => {
      const pct = orange(`${percent}%`)
      issues.push({
        level: percent > 97 ? 'error' : 'warn',
        message: `Inode usage is at ${pct} for mount ${green(mount)} [${blue(prepPath(path))}]`
      })
    })
  }

  // Check the Replicated license
  async function licenseCheck ({issues, path, stream}) {
    const latest = {
      version: 447,
      hash: 'c3bba67'
    }
    const line = await extractLine(line => r.startsWith('AppVersion:')(line))(stream())
    const [match, hash, version] = line.match(/:\s*(\w+)\s*\((\d+)\)$/) || []

    if (!match) {
      issues.push({
        level: 'error',
        message: 'Version information not found.'
      })
    } else if (Number(version) < latest.version) {
      issues.push({
        level: 'warn',
        message: `Installed version (${orange(version)}:${yellow(hash)}) is behind the latest (${orange(latest.version)}:${yellow(latest.hash)}) [${blue(prepPath(path))}]`
      })
    }
  }

  // Check container states
  async function dockerPsCheck ({issues, path, stream}) {
    (await parseStream(stream()))
      .filter(container => !r.startsWith('sha256:')(container.Image))
      .filter(container => container.State !== 'running')
      .forEach(container => {
        const state = container.State
        const name = r.head(container.Names)
        const image = container.Image

        issues.push({
          level: 'warn',
          message: `State for container ${yellow(name)} [${green(image)}] is ${(state ? blue(`'${state}'`) : purple(state))} [${blue(prepPath(path))}]`
        })
      })
  }

  async function dockerInfoCheck ({issues, path, stream}) {
    const info = await parseStream(stream())
    const {
      Architecture: arch = '',
      NCPU: cpuCount = 0,
      MemTotal: totalMem = 0,
      OSType: os = '',
      ServerVersion: versionString = ''
    } = info

    if (os !== 'linux') {
      issues.push({
        level: 'warn',
        message: `Unsupported OS: ${blue(os)}`
      })
    }

    if (arch !== 'x86_64' && arch !== 'x64') {
      issues.push({
        level: 'warn',
        message: `Unsupported Architecture: ${blue(arch)}`
      })
    }

    if (cpuCount < 4) {
      issues.push({
        level: cpuCount < 2 ? 'error' : 'warn',
        message: `Only ${orange(cpuCount)} CPU`
      })
    }

    if (totalMem < 16000000000) {
      const crit = totalMem < 8000000000
      issues.push({
        level: crit ? 'error' : 'warn',
        message: `System memory is ${crit ? 'insufficient' : 'low'}: ${orange(totalMem.toLocaleString())} bytes`
      })
    }

    const dockerVersion = semver.coerce(
      r.compose(
        r.join('.'),
        r.map(s => s.replace(/^0+/, '')),
        r.split('.')
      )(versionString)
    )

    if (!semver.satisfies(dockerVersion, '>=17.6.0')) {
      issues.push({
        level: 'warn',
        message: `Docker is out of date: version ${green(versionString)}`
      })
    }
  }
}

/* What files should the doctor inspect?
 *
 * errors.txt ?
 * license.txt ?
 *
 * daemon/commands/date +
 * daemon/commands/df +
 * daemon/commands/df_inodes -
 * daemon/commands/dmesg ?
 * daemon/commands/free +
 * daemon/commands/hostname -
 * daemon/commands/ip_addr_show -
 * daemon/commands/ip_link_show -
 * daemon/commands/ip_route_show -
 * daemon/commands/ps ?
 * daemon/commands/uptime ?
 *
 * daemon/docker/docker_info.json +
 * daemon/docker/docker_ps_a.json +
 *
 * daemon/etc/centos-release -
 * daemon/etc/hostname -
 * daemon/etc/hosts -
 * daemon/etc/os-release -
 * daemon/etc/sysconfig/replicated ?
 * daemon/etc/sysconfig/replicated-operator ?
 * daemon/etc/system-release ?
 * daemon/etc/systemd/system/docker.service.d/http-proxy.conf ?
 *
 * daemon/journald/replicated-operator.log ?
 * daemon/journald/replicated-ui.log ?
 * daemon/journald/replicated.log ?
 *
 * daemon/proc/cpuinfo ?
 * daemon/proc/meminfo ?
 * daemon/proc/mounts ?
 * daemon/proc/uptime ?
 * daemon/proc/version ?
 * daemon/proc/vmstat ?
 *
 * daemon/replicated/config-commands.txt ?
 * daemon/replicated/daemon.json ?
 * daemon/replicated/daemon.json ?
 * daemon/replicated/hostInfo.json ?
 * daemon/replicated/ledis-app.dump ?
 * daemon/replicated/ledis-registry.dump ?
 * daemon/replicated/params.json ?
 * daemon/replicated/replicated-inspect.json ?
 * daemon/replicated/replicated-operator-inspect.json ?
 * daemon/replicated/replicated-operator.log ?
 * daemon/replicated/replicated-ui-inspect.json ?
 * daemon/replicated/replicated-ui.log ?
 * daemon/replicated/replicated-versions.txt ?
 * daemon/replicated/replicated.log ?
 * daemon/replicated/runtime/goroutines.txt ?
 * daemon/replicated/tasks.txt ?
 *
 * scheduler/nodes.txt ?
 *
 * scheduler/container/.../docker_inspect.json ?
 * scheduler/container/.../*.log ?
 */
